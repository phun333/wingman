import { os } from "@orpc/server";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../convex/_generated/api";

const base = os;

export const listUsers = base
  .route({ method: "GET", path: "/users", summary: "List all users" })
  .handler(async () => {
    return await convex.query(api.users.list);
  });

export const getUserById = base
  .route({ method: "GET", path: "/users/{id}", summary: "Get user by ID" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await convex.query(api.users.getById, { id: input.id as any });
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
    return await convex.mutation(api.users.create, input);
  });

export const updateUser = base
  .route({ method: "PUT", path: "/users/{id}", summary: "Update a user" })
  .input(
    z.object({
      id: z.string(),
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
    })
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return await convex.mutation(api.users.update, { id: id as any, ...data });
  });

export const deleteUser = base
  .route({ method: "DELETE", path: "/users/{id}", summary: "Delete a user" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await convex.mutation(api.users.remove, { id: input.id as any });
  });

export const router = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
