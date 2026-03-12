import { markNotificationsReadSchema } from "@/lib/validations/notifications";

describe("notifications validations", () => {
  it("accepts mark-all payloads", () => {
    const parsed = markNotificationsReadSchema.safeParse({
      mark_all: true
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty id lists when mark_all is false", () => {
    const parsed = markNotificationsReadSchema.safeParse({
      notification_ids: [],
      mark_all: false
    });

    expect(parsed.success).toBe(false);
  });
});
