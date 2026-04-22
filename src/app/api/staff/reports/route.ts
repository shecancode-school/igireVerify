import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { eachDayOfInterval, format, isSameDay } from "date-fns";

/**
 * GET /api/staff/reports
 * Read-only participant attendance report (same shape as admin). Staff cannot mutate data.
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const programId = searchParams.get("programId");
    const formatType = searchParams.get("format") || "json";

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const attendanceCol = db.collection("attendance");
    const usersCol = db.collection("users");
    const programsCol = db.collection("programs");

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

    let programs;
    if (programId && ObjectId.isValid(programId)) {
      programs = await programsCol
        .find({ _id: new ObjectId(programId), isActive: true })
        .toArray();
    } else {
      programs = await programsCol.find({ isActive: true }).toArray();
    }
    const programMap = new Map(programs.map((p) => [p._id.toString(), p]));

    if (programs.length === 0) {
      if (formatType === "json") {
        return NextResponse.json({ data: [] });
      }
      return new NextResponse("Date,Name,Email,Program,Status,Check-in,Check-out,Late By,Location\n", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="igire-staff-report.csv"`,
        },
      });
    }

    const userQuery: Record<string, unknown> = {
      role: "participant",
      programId: { $in: programs.map((p) => p._id) },
    };
    if (programId && ObjectId.isValid(programId)) {
      userQuery.programId = new ObjectId(programId);
    }

    const users = await usersCol.find(userQuery).toArray();

    // Report should follow the attendance day, not insertion time.
    const attendanceRecords = await attendanceCol
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .toArray();

    const reportData: Array<Record<string, string>> = [];

    const sameUser = (r: unknown, userId: ObjectId) => {
      const row = r as { userId?: unknown };
      const uid = userId.toString();
      const rid = row.userId;
      if (rid == null) return false;
      if (typeof rid === "string") return rid === uid;
      if (typeof rid === "object" && rid !== null && "toString" in rid) {
        return (rid as ObjectId).toString() === uid;
      }
      return false;
    };

    const formatGps = (gps: unknown) => {
      const point = gps as
        | { latitude?: unknown; longitude?: unknown; accuracy?: unknown }
        | null
        | undefined;
      if (
        !point ||
        typeof point.latitude !== "number" ||
        typeof point.longitude !== "number"
      ) {
        return null;
      }
      const accuracy =
        typeof point.accuracy === "number" ? ` (${Math.round(point.accuracy)}m)` : "";
      return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}${accuracy}`;
    };

    for (const date of datesInRange) {
      const dayName = format(date, "EEEE");

      for (const user of users) {
        if (!user.programId) continue;

        const program = programMap.get(user.programId.toString());
        if (!program) continue;

        const workingDays = program.schedule?.days || [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ];
        if (!workingDays.includes(dayName)) continue;

        const record = attendanceRecords.find((r: any) => {
          if (!sameUser(r, user._id)) return false;
          const recordDate = r.date || r.checkInTime || r.createdAt;
          if (!recordDate) return false;
          return isSameDay(new Date(recordDate as string), date);
        });

        const dateStr = format(date, "MM/dd/yyyy");

        if (record) {
          const checkInTime = record.checkInTime
            ? new Date(record.checkInTime as string)
            : null;
          const checkInStr = checkInTime ? format(checkInTime, "HH:mm") : "None";
          let checkOutStr = "--";
          if (record.checkOutTime) {
            checkOutStr = format(new Date(record.checkOutTime as string), "HH:mm");
          }

          const rowStatus =
            (record.checkInStatus as string) ||
            (record.status as string) ||
            (record.type === "absent" ? "absent" : "on-time");
          let lateBy = "-";
          if (rowStatus === "late" && checkInTime && program.schedule?.lateAfter) {
            const [h, m] = program.schedule.lateAfter.split(":").map(Number);
            const expected = new Date(checkInTime);
            expected.setHours(h, m, 0, 0);
            const diffMins = Math.floor(
              (checkInTime.getTime() - expected.getTime()) / 60000
            );
            if (diffMins > 0) {
              lateBy =
                diffMins >= 60
                  ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
                  : `${diffMins} min`;
            }
          }
          const hasCheckOut = Boolean(record.checkOutTime) || record.type === "completed";
          const statusDisplay =
            rowStatus === "absent"
              ? "Absent"
              : rowStatus === "late"
                ? (hasCheckOut ? "Late" : "Checked In")
                : hasCheckOut
                  ? "Present"
                  : "Checked In";
          const gps = record.checkInGpsLocation || record.checkOutGpsLocation;
          const location =
            (record.locationLabel as string | undefined) ||
            formatGps(gps) ||
            (statusDisplay === "Present" || statusDisplay === "Late" || statusDisplay === "Checked In"
              ? "Igire Rwanda Organisation premises"
              : "Unknown");

          reportData.push({
            date: dateStr,
            name: user.name as string,
            email: user.email as string,
            program: program.name as string,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            status: statusDisplay,
            lateBy,
            location,
            photo: user.profilePhotoUrl ? "[View]" : "-",
          });
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date <= today) {
            reportData.push({
              date: dateStr,
              name: user.name as string,
              email: user.email as string,
              program: program.name as string,
              checkIn: "None",
              checkOut: "--",
              status: "Absent",
              lateBy: "-",
              location: "Unknown",
              photo: "-",
            });
          }
        }
      }
    }

    if (formatType === "json") {
      return NextResponse.json({ data: reportData });
    }

    const headers = [
      "Date",
      "Name",
      "Email",
      "Program",
      "Status",
      "Check-in",
      "Check-out",
      "Late By",
      "Location",
    ];
    const csvContent = [
      headers.join(","),
      ...reportData.map((r) =>
        [
          r.date,
          r.name,
          r.email,
          r.program,
          r.status,
          r.checkIn,
          r.checkOut,
          r.lateBy,
          r.location,
        ]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="igire-staff-report.csv"`,
      },
    });
  } catch (error) {
    console.error("[STAFF/REPORTS] GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
