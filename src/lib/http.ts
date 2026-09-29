import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export interface ApiResponseBody<T = unknown> {
  status: boolean;
  message: string;
  data: T | null;
}

const SUCCESS_MESSAGE = "Request completed successfully.";

const send = <T>(data: T, status = 200) => {
  const body: ApiResponseBody<T> = { status: true, message: SUCCESS_MESSAGE, data };
  return NextResponse.json(body, { status });
}

const failed = (status: number, message: string, data: unknown = null) => {
  const body: ApiResponseBody<unknown> = { status: false, message, data };
  return NextResponse.json(body, { status });
}

export const ApiResponse = {
  send,
  failed
};

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new AppError(400, "Invalid JSON body.");
  }
}


export async function handleRoute(action: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    const response = await action();
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.failed(error.status, error.message);
    }
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return ApiResponse.failed(400, message);
    }
    console.error(error);
    return ApiResponse.failed(500, "Something went wrong.");
  }
}
