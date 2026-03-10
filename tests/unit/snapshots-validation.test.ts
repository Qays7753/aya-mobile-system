import { createSnapshotSchema } from "@/lib/validations/snapshots";

describe("createSnapshotSchema", () => {
  it("accepts an empty payload or optional notes", () => {
    expect(createSnapshotSchema.safeParse({}).success).toBe(true);
    expect(
      createSnapshotSchema.safeParse({
        notes: "إقفال نهاية اليوم"
      }).success
    ).toBe(true);
  });

  it("rejects notes longer than 500 characters", () => {
    const parsed = createSnapshotSchema.safeParse({
      notes: "أ".repeat(501)
    });

    expect(parsed.success).toBe(false);
  });
});
