const { getSheets, getSheetId, safeGetValues } = require("./sheets.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { appointment_id, action, new_date, new_time_slot, decline_reason, admin_notes } = JSON.parse(event.body);

    if (!appointment_id || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: "appointment_id and action are required" }) };
    }

    const sheets = getSheets();
    const spreadsheetId = getSheetId();

    const rows = await safeGetValues(sheets, spreadsheetId, "Appointments!A:J");
    const rowIndex = rows.findIndex((r) => r[0] === appointment_id);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Appointment not found" }) };
    }

    const row = rows[rowIndex];
    const updateRange = `Appointments!A${rowIndex + 1}:J${rowIndex + 1}`;

    let newStatus = row[7];
    let updatedNotes = row[9] || "";

    switch (action) {
      case "approve":
        newStatus = "Confirmed";
        if (admin_notes) updatedNotes += `\nAdmin: ${admin_notes}`;
        break;
      case "decline":
        newStatus = "Declined";
        updatedNotes += `\nDeclined: ${decline_reason || "No reason provided"}`;
        if (admin_notes) updatedNotes += `\nAdmin: ${admin_notes}`;
        break;
      case "reschedule":
        newStatus = "Pending Approval";
        updatedNotes += `\nRescheduled to ${new_date} ${new_time_slot}`;
        if (admin_notes) updatedNotes += `\nAdmin: ${admin_notes}`;
        break;
      case "cancel":
        newStatus = "Cancelled";
        updatedNotes += `\nCancelled by admin`;
        if (admin_notes) updatedNotes += `\nAdmin: ${admin_notes}`;
        break;
      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };
    }

    const updatedRow = [
      row[0], row[1], row[2],
      action === "reschedule" ? new_date : row[3],
      action === "reschedule" ? new_time_slot : row[4],
      row[5], row[6], newStatus, row[8], updatedNotes.trim(),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, appointment_id, action, new_status: newStatus }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
