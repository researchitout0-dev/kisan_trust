import jwt from "jsonwebtoken";

/**
 * Middleware to verify lender JWT tokens.
 * Separate from farmer auth — lenders get their own tokens.
 */
const verifyLenderToken = (req, res, next) => {
    const authHeaders = req.headers.authorization;

    if (!authHeaders || !authHeaders.startsWith("Bearer")) {
        return res.status(401).json({ message: "No Token Provided" });
    }

    const token = authHeaders.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lender tokens have role: "lender"
        if (decoded.role !== "lender") {
            return res.status(403).json({ message: "Access denied. Lender credentials required." });
        }

        req.lenderID = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default verifyLenderToken;
