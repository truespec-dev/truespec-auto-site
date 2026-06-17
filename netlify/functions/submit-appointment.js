const { getSheets, getSheetId, safeGetValues } = require("./sheets.js");

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = d.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? "st" : (day % 10 === 2 && day !== 12) ? "nd" : (day % 10 === 3 && day !== 13) ? "rd" : "th";
  return months[d.getMonth()] + " " + day + suffix + ", " + d.getFullYear();
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const data = JSON.parse(event.body);
    const {
      customer_name, customer_phone, car_email,
      car_year, car_make, car_model,
      preferred_date, time_slot_pref,
      service_needed, specific_notes,
    } = data;

    if (!customer_name || !car_year || !car_make || !car_model || !preferred_date || !service_needed?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const sheets = getSheets();
    const spreadsheetId = getSheetId();

    // Check/create customer
    const customers = await safeGetValues(sheets, spreadsheetId, "Customers!A:F");
    let customerId = null;
    const existingRow = customers.find(
      (r) => r[1]?.toLowerCase() === customer_name.toLowerCase() && r[3] === customer_phone
    );

    if (existingRow) {
      customerId = existingRow[0];
    } else {
      const nextId = "C" + String(customers.length).padStart(3, "0");
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Customers!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[nextId, customer_name.split(" ")[0], customer_name.split(" ").slice(1).join(" "), customer_phone, car_email || "", ""]] },
      });
      customerId = nextId;
    }

    // Check/create vehicle
    const vehicles = await safeGetValues(sheets, spreadsheetId, "Vehicles!A:F");
    let vehicleId = null;
    const existingVeh = vehicles.find(
      (r) => r[1] === customerId && r[2] === car_year && r[3]?.toLowerCase() === car_make.toLowerCase() && r[4]?.toLowerCase() === car_model.toLowerCase()
    );

    if (existingVeh) {
      vehicleId = existingVeh[0];
    } else {
      const nextVid = "V" + String(vehicles.length).padStart(3, "0");
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Vehicles!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[nextVid, customerId, car_year, car_make, car_model, ""]] },
      });
      vehicleId = nextVid;
    }

    // Create appointment
    const appointments = await safeGetValues(sheets, spreadsheetId, "Appointments!A:J");
    const nextAid = "A" + String(appointments.length).padStart(3, "0");

    const services = Array.isArray(service_needed) ? service_needed.join(", ") : service_needed;
    const niceServices = service_needed.map(function(s) {
      return s.replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }).join(", ");
    const niceDate = formatDate(preferred_date);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Appointments!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          nextAid, customerId, vehicleId, preferred_date, time_slot_pref || "",
          services, "Online", "Pending Approval", specific_notes || "", "",
        ]],
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        appointment_id: nextAid,
        message: `Thank you for scheduling with True Spec Auto Garage, ${customer_name}! Your request for ${niceServices} on ${niceDate} has been received and will be reviewed shortly. You will be notified with a confirmed appointment time.`,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
