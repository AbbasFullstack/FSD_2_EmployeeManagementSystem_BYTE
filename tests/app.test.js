process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let mongoose;
let app;
let User;
let Employee;
let AuditLog;
let adminToken;
let userToken;

const employee = {
  name: "Test Employee",
  email: "test.employee@example.com",
  phone: "+92 300 1234567",
  department: "Engineering",
  position: "Backend Developer",
  salary: 150000,
  joinDate: "2025-01-15",
  status: "active"
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri("employee_management_test");
  app = require("../server");
  mongoose = require("mongoose");
  User = require("../models/User");
  Employee = require("../models/Employee");
  AuditLog = require("../models/AuditLog");
  await mongoose.connect(process.env.MONGODB_URI);

  await User.create({ name:"Admin", email:"admin@test.com", password:"Admin@123", role:"admin" });
  await User.create({ name:"Regular User", email:"user@test.com", password:"User@12345", role:"user" });

  adminToken = (await request(app).post("/api/auth/login").send({email:"admin@test.com",password:"Admin@123"})).body.token;
  userToken = (await request(app).post("/api/auth/login").send({email:"user@test.com",password:"User@12345"})).body.token;
  assert.ok(adminToken);
  assert.ok(userToken);
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("health check returns 200", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test("auth register, login and profile", async () => {
  const registered = await request(app).post("/api/auth/register").send({
    name:"New User", email:"new.user@test.com", password:"NewUser@123"
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.role, "user");

  const login = await request(app).post("/api/auth/login").send({
    email:"new.user@test.com", password:"NewUser@123"
  });
  assert.equal(login.status, 200);

  const profile = await request(app).get("/api/auth/me")
    .set("Authorization", "Bearer " + login.body.token);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.user.email, "new.user@test.com");
});

test("employee list, get, create, update and delete", async () => {
  const empty = await request(app).get("/api/employees")
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(empty.status, 200);
  assert.equal(empty.body.count, 0);

  const created = await request(app).post("/api/employees")
    .set("Authorization", "Bearer " + adminToken).send(employee);
  assert.equal(created.status, 201);
  const id = created.body.employee._id;

  const fetched = await request(app).get("/api/employees/" + id)
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.employee._id, id);

  const updated = await request(app).put("/api/employees/" + id)
    .set("Authorization", "Bearer " + adminToken)
    .send({position:"Senior Backend Developer",salary:175000});
  assert.equal(updated.status, 200);
  assert.equal(updated.body.employee.salary, 175000);

  const deleted = await request(app).delete("/api/employees/" + id)
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(deleted.status, 200);

  const missing = await request(app).get("/api/employees/" + id)
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(missing.status, 404);
});

test("PUT and DELETE create audit logs with previous state", async () => {
  const target = await Employee.create({...employee, email:"audit.target@test.com"});
  const beforeUpdate = await AuditLog.countDocuments();

  const update = await request(app).put("/api/employees/" + target._id)
    .set("Authorization", "Bearer " + adminToken).send({salary:199000});
  assert.equal(update.status, 200);
  assert.equal(await AuditLog.countDocuments(), beforeUpdate + 1);

  const editLog = await AuditLog.findOne({employeeId:target._id,action:"edit"}).sort({timestamp:-1});
  assert.ok(editLog);
  assert.equal(editLog.previousData.salary, 150000);

  const beforeDelete = await AuditLog.countDocuments();
  const deleted = await request(app).delete("/api/employees/" + target._id)
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(deleted.status, 200);
  assert.equal(await AuditLog.countDocuments(), beforeDelete + 1);

  const deleteLog = await AuditLog.findOne({employeeId:target._id,action:"delete"}).sort({timestamp:-1});
  assert.ok(deleteLog);
  assert.equal(deleteLog.previousData.salary, 199000);
});

test("audit logs are read-only", async () => {
  const log = await AuditLog.findOne();
  assert.ok(log);

  const put = await request(app).put("/api/audit-logs/" + log._id)
    .set("Authorization", "Bearer " + adminToken).send({action:"delete"});
  const del = await request(app).delete("/api/audit-logs/" + log._id)
    .set("Authorization", "Bearer " + adminToken);

  assert.equal(put.status, 404);
  assert.equal(del.status, 404);
});

test("error handling returns 400, 401, 403 and 404", async () => {
  assert.equal((await request(app).get("/api/employees")).status, 401);

  const badId = await request(app).get("/api/employees/not-an-object-id")
    .set("Authorization", "Bearer " + adminToken);
  assert.equal(badId.status, 400);

  const forbidden = await request(app).post("/api/employees")
    .set("Authorization", "Bearer " + userToken).send(employee);
  assert.equal(forbidden.status, 403);

  assert.equal((await request(app).get("/api/does-not-exist")).status, 404);

  const invalidBody = await request(app).post("/api/employees")
    .set("Authorization", "Bearer " + adminToken).send({name:"Incomplete"});
  assert.equal(invalidBody.status, 400);
});
