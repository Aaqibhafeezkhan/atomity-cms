import { describe, expect, it } from "vitest";
import { ApiError } from "@/types/api";
import { CONFLICT_MESSAGE, describeError, humanizeFieldNames } from "./errors";
import { CAREER } from "./form.fixtures";

describe("describeError", () => {
  it("recognises a version conflict and explains it", () => {
    const failure = describeError(new ApiError("VERSION_CONFLICT", "server text", 409));
    expect(failure).toEqual({ kind: "conflict", message: CONFLICT_MESSAGE });
  });

  it("passes the server's message for a taken slug and a failed publish", () => {
    expect(describeError(new ApiError("SLUG_TAKEN", 'Another news item already uses the slug "hello"', 409))).toEqual({
      kind: "slug-taken",
      message: 'Another news item already uses the slug "hello"',
    });
    expect(describeError(new ApiError("NOT_PUBLISHABLE", "Add a title before publishing.", 422))).toEqual({
      kind: "not-publishable",
      message: "Add a title before publishing.",
    });
  });

  it("names fields by their label in validation messages", () => {
    const failure = describeError(
      new ApiError("VALIDATION_ERROR", "fields.applyUrl must be a valid URL starting with http:// or https://", 400),
      CAREER,
    );
    expect(failure.kind).toBe("validation");
    expect(failure.message).toBe("“Apply URL” must be a valid URL starting with http:// or https://");
  });

  it("falls back to the message for anything else", () => {
    expect(describeError(new ApiError("NETWORK_ERROR", "Could not reach the server.", 0))).toEqual({
      kind: "other",
      message: "Could not reach the server.",
    });
    expect(describeError(new Error("boom"))).toEqual({ kind: "other", message: "boom" });
    expect(describeError("weird").message).toBe("Something went wrong.");
  });
});

describe("humanizeFieldNames", () => {
  it("leaves unknown field names alone", () => {
    expect(humanizeFieldNames("fields.stray is not a field", CAREER)).toBe("fields.stray is not a field");
  });

  it("rewrites every field mentioned", () => {
    expect(humanizeFieldNames("fields.applyUrl bad; fields.closingDate worse", CAREER)).toBe("“Apply URL” bad; “Closing date” worse");
  });
});
