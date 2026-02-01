"use client";
import Image from "next/image";
import saudia_image from "../../public/8a3835bf-b002-4ba7-91ef-682c53935961.png";

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
    IST: "Istanbul Airport(IST)",
    MED: "Madinah(MED)",
    JED: "Jeddah(JED)",
    LHR: "London Heathrow(LHR)",
    DXB: "Dubai(DXB)",
    DOH: "Hamad International Airport(DOH)",
    AUH: "Abu Dhabi(AUH)",
    SAW: "Istanbul Airport(SAW)",
    CAI: "Cairo(CAI)",
    AMM: "Queen Alia(AMM)",
    BAH: "Bahrain(BAH)",
    RUH: "Riyadh(RUH)",
    ESB: "Turkey(ESB)",
    DAC: "Dhaka(DAC)",
    DEL: "New Delhi(DEL)",
    BOM: "Mumbai(BOM)",
    ADD: "Addis Ababa(ADD)",
    MCT: "Muscat(MCT)",
    LGW: "London Gatwick(LGW)",
    STN: "London Stansted(STN)",
    MAN: "Manchester(MAN)",
    DUB: "Dublin(DUB)",
  };

  const currencyOptions = [
    { code: "BDT", symbol: "৳" },
    { code: "USD", symbol: "$" },
    { code: "GBP", symbol: "£" },
    { code: "EUR", symbol: "€" },
    { code: "AED", symbol: "د.إ" },
    { code: "SAR", symbol: "﷼" },
  ];

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
    currency: "GBP",
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

  const formatDateWithOffset = (dateStr, offset = 0) => {
    const base = parseFlightDate(dateStr);
    base.setDate(base.getDate() + offset);

    const day = String(base.getDate()).padStart(2, "0");
    const month = base
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();

    return `${day} ${month}`;
  };

  const parseFlightDate = (d = "") => {
    // "07OCT" → Date object (year is irrelevant, we just need day diff)
    const day = Number(d.slice(0, 2));
    const monthStr = d.slice(2).toUpperCase();

    const months = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };

    return new Date(2025, months[monthStr], day);
  };

  const parseTimeWithDayOffset = (t = "") => {
    const isNextDay = t.includes("#");
    const clean = t.replace("#", "");

    return {
      time: clean, // "2240"
      dayOffset: isNextDay ? 1 : 0,
    };
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
    return name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // --- NEW helpers for robust time parsing ---
  const normalizeTimeStr = (raw = "") => {
    // Keep leading '#' if present
    const hasHash = raw.includes("#");
    const cleaned = raw.replace("#", "").trim();
    // capture AM/PM marker if any
    const ampmMatch = cleaned.match(/([AP])$/);
    const ampm = ampmMatch ? ampmMatch[1] : "";
    // digits only
    const digits = cleaned.replace(/[AP]$/, "");
    // pad to 4 digits (e.g. 600 -> 0600)
    const padded = digits.padStart(4, "0");
    return `${hasHash ? "#" : ""}${padded}${ampm}`;
  };

  const parseTimeUniversal = (t = "") => {
    if (!t) return { time: "", dayOffset: 0 };
    const normalized = normalizeTimeStr(t);
    const hasHash = normalized.includes("#");
    const clean = normalized.replace("#", "");
    // AM / PM
    if (/[AP]$/.test(clean)) {
      const isPM = clean.endsWith("P");
      let time = clean.replace(/[AP]/, "");
      let h = Number(time.slice(0, 2));
      const m = time.slice(2);

      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;

      return {
        time: `${String(h).padStart(2, "0")}${m}`,
        dayOffset: hasHash ? 1 : 0,
      };
    }

    // 24h format (already 4-digit)
    return {
      time: clean,
      dayOffset: hasHash ? 1 : 0,
    };
  };

  const convertAmPmTo24 = (t = "") => {
    const isPM = t.endsWith("P");
    const isAM = t.endsWith("A");

    let time = t.replace(/[AP]/, "");
    let h = Number(time.slice(0, 2));
    const m = time.slice(2);

    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;

    return `${String(h).padStart(2, "0")}${m}`;
  };

  const parseArrivalDateOverride = (line, depDate) => {
    const dateMatches = line.match(/\d{2}[A-Z]{3}/g);

    // If only one date → arrival same day
    if (!dateMatches || dateMatches.length === 1) {
      return { date: depDate, offset: 0 };
    }

    // Second date is arrival date
    return {
      date: dateMatches[1],
      offset: 0,
    };
  };

  // --- main parser ---
  const parseText = () => {
    const lines = rawText.split("\n");

    const flights = [];
    const airlinesFound = new Set();

    let lastFlightIndex = -1;

    lines.forEach((raw) => {
      const line = raw.trim();
      if (line.startsWith("/")) return;
      if (!line) return;

      // OPERATED BY line
      if (line.toUpperCase().startsWith("OPERATED BY") && lastFlightIndex !== -1) {
        const rawOp = line.replace(/OPERATED BY/i, "").trim();
        const normalizedOp = normalizeAirline(rawOp);

        flights[lastFlightIndex].operatedBy = normalizedOp;
        airlinesFound.add(normalizedOp);

        return;
      }

      // Flight line (starts with number or "1 ." etc)
      if (/^\d+/.test(line)) {
        // find date
        const dateMatch = line.match(/\d{2}[A-Z]{3}/);
        if (!dateMatch) return;
        const depDate = dateMatch[0];

        // --- find airline code near start ---
        // remove leading sequence number and dots then split
        const afterSeq = line.replace(/^\d+\.?\s*/, "");
        const tokens = afterSeq.split(/\s+/);
        let airlineCode = null;
        for (let t of tokens) {
          if (/^[A-Z]{2,3}$/.test(t)) {
            // choose first pure 2-3 letter token (this will be RJ, QR, GF, etc)
            airlineCode = t;
            break;
          }
        }
        const airlineName = airlineDataset[airlineCode] || airlineCode || "";

        if (airlineName) airlinesFound.add(airlineName);

        // --- find airports ---
        // take substring after the date to narrow search
        const afterDate = line.slice(line.indexOf(depDate) + depDate.length);

        // try joined 6-letter block first (e.g. LHRAMM)
        let fromCode = null;
        let toCode = null;
        const joined = afterDate.match(/([A-Z]{3})([A-Z]{3})/);
        if (joined) {
          fromCode = joined[1];
          toCode = joined[2];
        } else {
          // fallback: find 3-letter tokens but skip month tokens
          const months = [
            "JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"
          ];
          const pot = (afterDate.match(/\b[A-Z]{3}\b/g) || []).filter(x => !months.includes(x));
          if (pot.length >= 2) {
            fromCode = pot[0];
            toCode = pot[1];
          }
        }

        if (!fromCode || !toCode) return;

        // --- find times (departure and arrival) ---
        // allow times like 2150, 600A, #0720, 0215P etc
        const timeMatchesRaw = afterDate.match(/#?\d{3,4}[AP]?/g);
        if (!timeMatchesRaw || timeMatchesRaw.length < 2) return;

        // normalize and parse first two times found
        const depParsed = parseTimeUniversal(timeMatchesRaw[0]);
        const arrParsed = parseTimeUniversal(timeMatchesRaw[1]);

        const arrivalDateInfo = parseArrivalDateOverride(line, depDate);

        flights.push({
          airline: airlineName,
          fromCode,
          toCode,
          date: depDate,
          dep: depParsed.time,
          arr: arrParsed.time,
          arrDayOffset:
            arrivalDateInfo.date !== depDate ? 1 : arrParsed.dayOffset,
          arrivalDate: arrivalDateInfo.date,
          operatedBy: null,
        });

        lastFlightIndex = flights.length - 1;
      }
    });

    const parsed = flights.map((f, i) => {
      let transit = "–";

      if (flights[i + 1] && flights[i + 1].fromCode === f.toCode) {
        const currArrivalMinutes =
          toMinutes(f.arr) + (f.arrDayOffset || 0) * 24 * 60;

        const nextDepartureMinutes = toMinutes(flights[i + 1].dep);

        // DATE CHECK (same day or +1 day only)
        const arrivalDate = parseFlightDate(f.date);
        arrivalDate.setDate(arrivalDate.getDate() + (f.arrDayOffset || 0));

        const nextDate = parseFlightDate(flights[i + 1].date);

        const dayDiff = (nextDate - arrivalDate) / (1000 * 60 * 60 * 24);

        // only allow same day (0) or next day (1)
        if (dayDiff === 0 || dayDiff === 1) {
          let diff = nextDepartureMinutes - currArrivalMinutes;

          if (diff < 0) diff += 24 * 60;

          transit = formatTransit(diff);
        } else {
          transit = "–";
        }
      }

      return {
        from: airportDataset[f.fromCode] || f.fromCode,
        to: airportDataset[f.toCode] || f.toCode,
        depart: `${f.date.slice(0, 2)} ${f.date.slice(2)} ${formatTime(f.dep)}`,
        arrive: `${formatDateWithOffset(
          f.arrivalDate || f.date,
          0,
        )} ${formatTime(f.arr)}`,

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

  const currencySymbol =
    currencyOptions.find((c) => c.code === meta.currency)?.symbol || "";

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
        <select
          className="border p-2"
          value={meta.currency}
          onChange={(e) => setMeta({ ...meta, currency: e.target.value })}
        >
          {currencyOptions.map((c) => (
            <option className="text-[#000000]" key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
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
        className="bg-[#8488ea] text-[#ffffff] px-4 py-2 rounded"
      >
        Generate Table
      </button>

      {/* Output */}
      {rows.length > 0 && (
        <div className="bg-image p-[2rem] bg-[#ffffff] text-[#000000]">
          <div className="absolute top-[1rem] right-[2rem]">
            <Image
              src={saudia_image}
              alt="Saudi Tourism Authority Logo"
              width={100}
              priority
            />
          </div>
          <div className="text-center font-semibold">
            <div className="bg-[#ffff00] inline-block px-3">
              {meta.airline} – Total Price:{" "}
              <strong>
                {currencySymbol}
                {totalPrice}
              </strong>
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
                      {f.label} {currencySymbol}
                      {price} × {count} ={" "}
                      <strong>
                        {currencySymbol}
                        {price * count}
                      </strong>
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
                  <td className="border p-2">{r.from}</td>
                  <td className="border p-2">{r.to}</td>
                  <td className="border p-2">{r.depart}</td>
                  <td className="border p-2">{r.arrive}</td>
                  <td className="border p-2">{r.transit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-md font-bold">
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
