import { z } from 'zod'

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const ErrorResponseSchema = z.object({
  error: z.string(),
})

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
})

export const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
