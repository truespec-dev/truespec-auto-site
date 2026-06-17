const { getSheets, getSheetId } = require("./_sheets.js");

const AUTO_HOURS = { "Mon-Fri": { open: 8, close: 18 }, "Sat": { open: 9, close: 14 }, "Sun": null };
const TIRE_HOURS = { "Mon-Sun": { open: 7.5, close: 19 } };
const MAX_PER_SLOT = 3;

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

function getShopHours(shop, day) {
  if (shop === "auto") {
    if (day === "Sun") return null;
    if (day === "Sat") return AUTO_HOURS["Sat"];
    return AUTO_HOURS["Mon-Fri"];
  }
  return TIRE_HOURS["Mon-Sun"];
}

function timeToHour(slot) {
  const map = { morning: 9, afternoon: 13, evening: 17 };
  return map[slot] || 9;
}

exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const date = params.get("date");
    const timeSlot = params.get("time_slot");
    const services = (params.get("services") || "").split(",").map((s) => s.trim().toLowerCase());

    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ error: "Date is required" }) };
    }

    const day = getDayOfWeek(date);
    const sheets = getSheets();
    const spreadsheetId = getSheetId();

    const aptRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Appointments!A:J",
    });
    const appointments = (aptRes.data.values || []).slice(1);

    const dayApts = appointments.filter((r) => r[3] === date && r[7] !== "Cancelled" && r[7] !== "Declined");

    const autoCount = dayApts.filter((r) => {
      const svc = (r[5] || "").toLowerCase();
      return svc.includes("oil") || svc.includes("brake") || svc.includes("tune") || svc.includes("suspension") || svc.includes("alignment") || svc.includes("inspection") || svc.includes("other") || svc.includes("steering") || svc.includes("electrical");
    }).length;

    const tireCount = dayApts.filter((r) => {
      const svc = (r[5] || "").toLowerCase();
      return svc.includes("tire");
    }).length;

    const autoHours = getShopHours("auto", day);
    const tireHours = getShopHours("tire", day);

    const autoAvailable = autoHours ? Math.max(0, MAX_PER_SLOT - autoCount) : 0;
    const tireAvailable = Math.max(0, MAX_PER_SLOT - tireCount);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        day,
        auto_shop: {
          available: autoAvailable > 0,
          remaining: autoAvailable,
          hours: autoHours ? `${autoHours.open}:00 - ${autoHours.close}:00` : "Closed",
        },
        tire_center: {
          available: tireAvailable > 0,
          remaining: tireAvailable,
          hours: tireHours ? `${tireHours.open}:00 - ${tireHours.close}:00` : "Closed",
        },
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
