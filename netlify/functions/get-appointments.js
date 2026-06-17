const { getSheets, getSheetId } = require("./_sheets.js");

exports.handler = async (event) => {
  try {
    const sheets = getSheets();
    const spreadsheetId = getSheetId();

    const [aptRes, custRes, vehRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Appointments!A:J" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:F" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Vehicles!A:F" }),
    ]);

    const appointments = (aptRes.data.values || []).slice(1).map((r) => ({
      id: r[0], customer_id: r[1], vehicle_id: r[2], date: r[3],
      time_slot: r[4], services: r[5], source: r[6], status: r[7],
      notes: r[8], admin_notes: r[9],
    }));

    const customers = (custRes.data.values || []).reduce((acc, r) => {
      acc[r[0]] = { id: r[0], first_name: r[1], last_name: r[2], phone: r[3], email: r[4], notes: r[5] };
      return acc;
    }, {});

    const vehicles = (vehRes.data.values || []).reduce((acc, r) => {
      acc[r[0]] = { id: r[0], customer_id: r[1], year: r[2], make: r[3], model: r[4], vin: r[5] };
      return acc;
    }, {});

    const enriched = appointments.map((apt) => ({
      ...apt,
      customer: customers[apt.customer_id] || null,
      vehicle: vehicles[apt.vehicle_id] || null,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointments: enriched }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
