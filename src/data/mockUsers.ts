import { User } from "../types";

export const MOCK_USERS: User[] = [
  {
    id: "u-helpdesk",
    name: "Arjun Mehta",
    email: "helpdesk@company.com",
    password: "1234",
    pin: "4521",          // ← helpdesk ka personal PIN — sirf ussi ko pata
    role: "helpdesk",
    department: "Facilities",
  },
  {
    id: "u-hr",
    name: "Priya Sharma",
    email: "hr@company.com",
    password: "1234",
    pin: "7823",          // ← HR ka personal PIN — signature ke liye use hoga
    role: "hr",
    department: "Human Resources",
  },
  {
    id: "u-admin",
    name: "Suresh Verma",
    email: "admin@company.com",
    password: "1234",
    pin: "3967",          // ← Admin ka personal PIN
    role: "admin",
    department: "Administration",
  },
];
