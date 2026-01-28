"use client";

import { useState } from "react";

export default function FlightParserApp() {
  const [rawText, setRawText] = useState("");
  const airlineDataset = {
    TK: "Turkish Airline",
    PC: "Pegasus Airline",
    EK: "Emirates Airline",
    MS: "Egypt Airline",
    RJ: "Royal Jordanian Airline",
    GF: "Gulf Airline",
    QR: "Qatar Airways",
    AIR: "WIZZ AIR - WI",
    EY: "Etihad Airline",
    SV: "Saudia Airline",
    VF: "A-Jet Airline",
    VS: "Virgin Atlantic Airline",
    BG: "Biman Bangladesh Airline",
    AI: "Air India",
    FZ: "Fly Dubai Airline",
    ET: "Ethopian Airline",
    WY: "Oman Air",
    BA: "British Airways",
  };

  const airportDataset = {
    BHX: "Birmingham",
    IST: "Istanbul",
    MED: "Medina",
    JED: "Jeddah",
    LHR: "London Heathrow",
    DXB: "Dubai",
    DOH: "Doha",
    AUH: "Abu Dhabi",
    IST: "Istanbul Airport(IST)",
    SAW: "Istanbul Airport(SAW)",
    DXB: "Dubai(DXB)",
    CAI: "Cairo(CAI)",
    AMM: "Queen Alia(AMM)",
    BAH: "Bahrain(BAH)",
    DOH: "Hamad International Airport(DOH)",
    AUH: "Abu Dhabi(AUH)",
    JED: "Jeddah(JED)",
    RUH: "Riyadh(RUH)",
    MED: "Madinah(MED)",
    ESB: "Turkey(ESB)",
    SAW: "Istanbul(SAW)",
    LHR: "London Heathrow(LHR)",
    DAC: "Dhaka(DAC)",
    DEL: "New Delhi(DEL)",
    BOM: "Mumbai(BOM)",
    DXB: "Dubai(DXB)",
    ADD: "Addis Ababa(ADD)",
    MCT: "Muscat(MCT)",
    LHR: "London Heathrow(LHR)",
    LGW: "London Gatwick(LGW)",
    STN: "London Stansted(STN)",
    MAN: "Manchester(MAN)",
    DUB: "Dublin(DUB)",
  };

  const [meta, setMeta] = useState({
    airline: "",
    adultPrice: "",
    adultCount: "",
    youthPrice: "",
    youthCount: "",
    childPrice: "",
    childCount: "",
    infantPrice: "",
    infantCount: "",
    baggage:
      "Check in luggage 1 pieces 23KG each and Hand Luggage 7KG per person",
    cancellation: "Ticket Non-Refundable",
  });

  const fareItems = [
    {
      label: "Adult",
      price: meta.adultPrice,
      count: meta.adultCount,
    },
    {
      label: "Youth",
      price: meta.youthPrice,
      count: meta.youthCount,
    },
    {
      label: "Child",
      price: meta.childPrice,
      count: meta.childCount,
    },
    {
      label: "Infant",
      price: meta.infantPrice,
      count: meta.infantCount,
    },
  ];

  const [rows, setRows] = useState([]);

  const formatTime = (t = "") =>
    t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2)}` : t;
  const toMinutes = (time) => {
    const h = Number(time.slice(0, 2));
    const m = Number(time.slice(2));
    return h * 60 + m;
  };

  const formatTransit = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} h ${m} m`;
  };

  const normalizeAirline = (name = "") => {
    const upper = name.toUpperCase();

    for (const code in airlineDataset) {
      if (airlineDataset[code].toUpperCase() === upper) {
        return airlineDataset[code]; // canonical name
      }
    }
    return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const parseText = () => {
    const lines = rawText.split("\n");

    const flights = [];
    const airlinesFound = new Set();

    let lastFlightIndex = -1;

    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      // OPERATED BY line
      if (line.startsWith("OPERATED BY") && lastFlightIndex !== -1) {
        const rawOp = line.replace("OPERATED BY", "").trim();
        const normalizedOp = normalizeAirline(rawOp);

        flights[lastFlightIndex].operatedBy = normalizedOp;
        airlinesFound.add(normalizedOp);

        return;
      }

      // Flight line (starts with number)
      if (/^\d+\s*\./.test(line)) {
        const clean = line.replace(/\s+/g, " ");
        const parts = clean.split(" ");

        const airlineCode = parts[2]; // QR / BA
        const date = parts[5]; // 07OCT
        const route = parts[6]; // LHRDOH
        const dep = parts[8]; // 1340
        const arr = parts[9]; // 2240

        const airlineName = airlineDataset[airlineCode] || airlineCode;
        airlinesFound.add(airlineName);

        flights.push({
          airline: airlineName,
          fromCode: route.slice(0, 3),
          toCode: route.slice(3, 6),
          date,
          dep,
          arr,
          operatedBy: null,
        });

        lastFlightIndex = flights.length - 1;
      }
    });

    const parsed = flights.map((f, i) => {
      let transit = "–";

      if (flights[i + 1] && flights[i + 1].fromCode === f.toCode) {
        let diff = toMinutes(flights[i + 1].dep) - toMinutes(f.arr);
        if (diff < 0) diff += 24 * 60;
        transit = formatTransit(diff);
      }

      return {
        from: airportDataset[f.fromCode] || f.fromCode,
        to: airportDataset[f.toCode] || f.toCode,
        depart: `${f.date.slice(0, 2)} ${f.date.slice(2)} ${formatTime(f.dep)}`,
        arrive: `${f.date.slice(0, 2)} ${f.date.slice(2)} ${formatTime(f.arr)}`,
        transit,
        operatedBy: f.operatedBy,
      };
    });

    setRows(parsed);

    // Set airline text automatically
    setMeta((m) => ({
      ...m,
      airline: Array.from(airlinesFound).join(" / "),
    }));
  };

  const totalPrice =
    (Number(meta.adultPrice) || 0) * (Number(meta.adultCount) || 0) +
    (Number(meta.youthPrice) || 0) * (Number(meta.youthCount) || 0) +
    (Number(meta.childPrice) || 0) * (Number(meta.childCount) || 0) +
    (Number(meta.infantPrice) || 0) * (Number(meta.infantCount) || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Flight Text → Table Generator</h1>

      {/* Airline & Pricing Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="border p-2"
          placeholder="Adult Price"
          onChange={(e) => setMeta({ ...meta, adultPrice: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Adults"
          onChange={(e) => setMeta({ ...meta, adultCount: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Youth Price"
          onChange={(e) => setMeta({ ...meta, youthPrice: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Youths"
          onChange={(e) => setMeta({ ...meta, youthCount: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Child Price"
          onChange={(e) => setMeta({ ...meta, childPrice: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Children"
          onChange={(e) => setMeta({ ...meta, childCount: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Infant Price"
          onChange={(e) => setMeta({ ...meta, infantPrice: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Infants"
          onChange={(e) => setMeta({ ...meta, infantCount: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="border p-2"
          value={meta.baggage}
          placeholder="Baggage Allowance"
          onChange={(e) => setMeta({ ...meta, baggage: e.target.value })}
        />
        <input
          className="border p-2"
          value={meta.cancellation}
          placeholder="Cancellation Policy"
          onChange={(e) => setMeta({ ...meta, cancellation: e.target.value })}
        />
      </div>

      {/* Raw Input */}
      <textarea
        className="w-full border p-3 font-mono"
        rows={6}
        placeholder="Paste flight text here"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />

      <button
        onClick={parseText}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Generate Table
      </button>

      {/* Output */}
      {rows.length > 0 && (
        <div className="">
          <div className="text-center font-semibold">
            <div className="bg-[#ffff00] inline-block px-3">
              {console.log(meta)}
              {meta.airline} – Total Price: <strong>{totalPrice}</strong>
            </div>
            <div className="mb-[1rem]">
              {fareItems.map((f) => {
                const price = Number(f.price);
                const count = Number(f.count);

                // HIDE if price OR count is 0 / empty
                if (!price || !count) return null;

                return (
                  <div key={f.label} className="flex justify-center">
                    <span className="bg-[#ffff00]">
                      {f.label} {price} × {count} ={" "}
                      <strong>{price * count}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <table className="w-full border text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">From</th>
                <th className="border p-2">To</th>
                <th className="border p-2">Departure</th>
                <th className="border p-2">Arrival</th>
                <th className="border p-2">Transit Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    {r.from}
                    {r.operatedBy && (
                      <div className="text-xs italic text-gray-600">
                        (Operated by {r.operatedBy})
                      </div>
                    )}
                  </td>
                  <td className="border p-2">{r.to}</td>
                  <td className="border p-2">
                    {r.date} {r.depart}
                  </td>
                  <td className="border p-2">
                    {r.date} {r.arrive}
                  </td>
                  <td className="border p-2">{r.transit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-sm">
            <p>
              <strong>Notes:</strong> {meta.baggage}
            </p>
            <p>
              <strong>Cancellation Policy:</strong>{" "}
              <span className="text-[#ff0000]">{meta.cancellation}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
