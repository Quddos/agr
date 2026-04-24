import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Run with --env-file=.env or set env vars.");
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "staff"], default: "staff" },
  },
  { timestamps: true }
);

const cropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const statementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Crop = mongoose.models.Crop || mongoose.model("Crop", cropSchema);
const Statement = mongoose.models.Statement || mongoose.model("Statement", statementSchema);
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: "agric_management" });

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@agricms.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.SEED_ADMIN_NAME || "System Admin";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  const cropCount = await Crop.countDocuments();
  if (cropCount === 0) {
    const crops = await Crop.insertMany([
      {
        name: "Maize",
        category: "Cereal",
        quantity: 1200,
        unitPrice: 1.9,
        notes: "Dry season stock",
        createdBy: admin._id,
      },
      {
        name: "Cassava",
        category: "Root",
        quantity: 800,
        unitPrice: 1.2,
        notes: "Fresh harvest",
        createdBy: admin._id,
      },
      {
        name: "Tomato",
        category: "Vegetable",
        quantity: 450,
        unitPrice: 2.4,
        notes: "Greenhouse output",
        createdBy: admin._id,
      },
    ]);
    console.log(`Inserted ${crops.length} sample crops.`);
  } else {
    console.log("Crops already seeded, skipping sample crops.");
  }

  const statementCount = await Statement.countDocuments();
  if (statementCount === 0) {
    const firstCrop = await Crop.findOne({}).sort({ createdAt: 1 });
    const statements = await Statement.insertMany([
      {
        type: "income",
        amount: 1500,
        note: "Maize sales - local market",
        date: new Date(),
        crop: firstCrop?._id || null,
        createdBy: admin._id,
      },
      {
        type: "expense",
        amount: 400,
        note: "Fertilizer procurement",
        date: new Date(),
        crop: firstCrop?._id || null,
        createdBy: admin._id,
      },
      {
        type: "expense",
        amount: 220,
        note: "Transport and logistics",
        date: new Date(),
        createdBy: admin._id,
      },
    ]);
    console.log(`Inserted ${statements.length} sample statements.`);
  } else {
    console.log("Statements already seeded, skipping sample statements.");
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const products = await Product.insertMany([
      {
        name: "Fresh Maize (Bag)",
        category: "Cereal",
        description: "Clean, dried maize bag for household and bulk buyers.",
        price: 22.5,
        stock: 50,
        imageUrl:
          "https://images.unsplash.com/photo-1531177071276-99f171b40c8b?auto=format&fit=crop&w=1200&q=80",
        isActive: true,
      },
      {
        name: "Tomatoes (Crate)",
        category: "Vegetable",
        description: "Fresh farm tomatoes crate, sorted and ready for market.",
        price: 18.0,
        stock: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=1200&q=80",
        isActive: true,
      },
      {
        name: "Cassava Tubers (Bundle)",
        category: "Root",
        description: "Healthy cassava tubers bundle, great for processing.",
        price: 12.0,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1596638787647-904d822d751e?auto=format&fit=crop&w=1200&q=80",
        isActive: true,
      },
      {
        name: "Rice (10kg)",
        category: "Cereal",
        description: "Locally sourced rice pack for everyday cooking.",
        price: 16.75,
        stock: 80,
        imageUrl:
          "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80",
        isActive: true,
      },
    ]);
    console.log(`Inserted ${products.length} demo products.`);
  } else {
    console.log("Products already seeded, skipping demo products.");
  }

  console.log("Seed completed.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
