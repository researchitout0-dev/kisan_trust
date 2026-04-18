import json
import mysql.connector
from sentence_transformers import SentenceTransformer
from config import settings

def main():
    print("Connecting to MySQL...")
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME
    )
    cursor = conn.cursor()

    # 1. Safely add the JSON column if it doesn't already exist
    print("Checking for 'symptom_embedding' column...")
    try:
        cursor.execute("ALTER TABLE disease_symptoms ADD COLUMN symptom_embedding JSON")
        print("Added 'symptom_embedding' column to disease_symptoms.")
    except mysql.connector.Error as e:
        if e.errno == 1060: # Error 1060: Duplicate column name
            print("Column 'symptom_embedding' already exists.")
        else:
            raise

    # 2. Fetch symptoms
    print("Fetching symptoms from the database...")
    cursor.execute("SELECT symptom_id, symptom_text FROM disease_symptoms")
    records = cursor.fetchall()
    
    if not records:
        print("No symptoms found in 'disease_symptoms' table.")
        return

    symptom_ids = [r[0] for r in records]
    symptom_texts = [r[1] for r in records]

    # 3. Load the Hugging Face model
    print("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Compute embeddings in batches (significantly faster than processing one by one)
    # Using normalize_embeddings=True since cosine distance requires normalized vectors
    print(f"Encoding {len(symptom_texts)} symptoms...")
    embeddings = model.encode(
        symptom_texts, 
        batch_size=32, 
        show_progress_bar=True, 
        normalize_embeddings=True
    )

    # 4. Update the Database using `executemany` for high performance
    print("Updating the database with computed embeddings...")
    update_query = """
        UPDATE disease_symptoms
        SET symptom_embedding = %s
        WHERE symptom_id = %s
    """
    
    # Prepare batch data
    update_data = []
    for s_id, emb in zip(symptom_ids, embeddings):
        # Convert numpy array to list, then serialize to JSON
        emb_json = json.dumps(emb.tolist())
        update_data.append((emb_json, s_id))

    # Execute batch update
    cursor.executemany(update_query, update_data)
    conn.commit()

    print(f"Successfully updated {cursor.rowcount} records with embeddings.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
