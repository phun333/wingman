import { os } from "@orpc/server";
import { z } from "zod";
import { db, users } from "@ffh/db";
import { eq } from "drizzle-orm";

const base = os;

export const listUsers = base
  .route({ method: "GET", path: "/users", summary: "List all users" })
  .handler(async () => {
    const result = await db.select().from(users);
    return result;
  });

export const getUserById = base
  .route({ method: "GET", path: "/users/{id}", summary: "Get user by ID" })
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const result = await db.select().from(users).where(eq(users.id, input.id));
    const user = result[0];
    if (!user) throw new Error("User not found");
    return user;
  });

export const createUser = base
  .route({ method: "POST", path: "/users", summary: "Create a new user" })
  .input(
    z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })
  )
  .handler(async ({ input }) => {
    const result = await db.insert(users).values(input).returning();
    return result[0]!;
  });

export const updateUser = base
  .route({ method: "PUT", path: "/users/{id}", summary: "Update a user" })
  .input(
    z.object({
      id: z.string().uuid(),
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
    })
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    const user = result[0];
    if (!user) throw new Error("User not found");
    return user;
  });

export const deleteUser = base
  .route({ method: "DELETE", path: "/users/{id}", summary: "Delete a user" })
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const result = await db
      .delete(users)
      .where(eq(users.id, input.id))
      .returning();
    const user = result[0];
    if (!user) throw new Error("User not found");
    return { deleted: true };
  });

export const router = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
