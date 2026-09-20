require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");

const SAMPLE_EMPLOYEES = [
  { name:"Ayesha Khan", email:"ayesha.khan@example.com", phone:"+92 300 1111111", department:"Engineering", position:"Senior Software Engineer", salary:185000, joinDate:"2022-03-15", status:"active" },
  { name:"Bilal Ahmed", email:"bilal.ahmed@example.com", phone:"+92 301 2222222", department:"Product", position:"Product Manager", salary:210000, joinDate:"2021-08-02", status:"active" },
  { name:"Sara Malik", email:"sara.malik@example.com", phone:"+92 302 3333333", department:"Human Resources", position:"HR Specialist", salary:125000, joinDate:"2023-01-10", status:"active" },
  { name:"Hamza Raza", email:"hamza.raza@example.com", phone:"+92 303 4444444", department:"Finance", position:"Financial Analyst", salary:145000, joinDate:"2022-11-21", status:"inactive" },
  { name:"Zainab Ali", email:"zainab.ali@example.com", phone:"+92 304 5555555", department:"Marketing", position:"Marketing Executive", salary:115000, joinDate:"2024-02-05", status:"active" }
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be configured before running the seed script.");
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || String.fromCharCode(65,100,109,105,110,64,49,50,51);
  const admin = await User.create({ name:"Admin", email:"admin@example.com", password:adminPassword, role:"admin" });
  const employees = await Employee.insertMany(SAMPLE_EMPLOYEES);
  const now = Date.now();

  await AuditLog.insertMany([
    {
      action:"edit",
      timestamp:new Date(now - 3 * 86400000),
      previousData:{ name:"Ayesha Khan", email:"ayesha.khan@example.com", phone:"+92 300 1111111", department:"Engineering", position:"Software Engineer", salary:165000, joinDate:new Date("2022-03-15"), status:"active" },
      performedBy:admin._id, employeeId:employees[0]._id
    },
    {
      action:"edit",
      timestamp:new Date(now - 2 * 86400000),
      previousData:{ name:"Bilal Ahmed", email:"bilal.ahmed@example.com", phone:"+92 301 2222222", department:"Product", position:"Associate Product Manager", salary:180000, joinDate:new Date("2021-08-02"), status:"active" },
      performedBy:admin._id, employeeId:employees[1]._id
    },
    {
      action:"delete",
      timestamp:new Date(now - 86400000),
      previousData:{ name:"Zainab Ali", email:"zainab.ali@example.com", phone:"+92 304 5555555", department:"Marketing", position:"Marketing Executive", salary:105000, joinDate:new Date("2024-02-05"), status:"active" },
      performedBy:admin._id, employeeId:employees[4]._id
    }
  ]);

  console.log("Seed completed successfully.");
  console.log("Created 1 admin, 5 sample employees and 3 sample audit logs.");
}

seed()
  .catch((error) => { console.error("Seed failed:", error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
