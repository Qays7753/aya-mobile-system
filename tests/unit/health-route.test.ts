import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns a success envelope", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.status).toBe("ok");
    expect(payload.data.timestamp).toEqual(expect.any(String));
  });
});
