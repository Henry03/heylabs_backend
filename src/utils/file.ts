import fs from "fs";
import { KtpData } from "../interfaces/ktp.interface";

export function fileToBase64(filePath: string): string {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString("base64");
}

export function cleanJsonResponse(raw: string): string {
  return raw
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();
}

const VALID_GOLONGAN = ["A","B","O","AB",""];
const VALID_JK = ["LAKI-LAKI","PEREMPUAN"];
const VALID_STATUS = ["BELUM KAWIN","KAWIN","CERAI HIDUP","CERAI MATI",""];
const VALID_WN = ["WNI","WNA",""];

function isDateDDMMYYYY(s: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(s)) return false;
  const [dd, mm, yyyy] = s.split("-").map(Number);
  if (mm < 1 || mm > 12) return false;
  const maxDays = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= maxDays;
}

function safeDateOrEmpty(s: any): string {
  if (!s) return "";
  const t = String(s).trim();
  if (t.toUpperCase() === "SEUMUR HIDUP") return "SEUMUR HIDUP";
  return isDateDDMMYYYY(t) ? t : "";
}

export function normalizeKtpData(input: any): KtpData {
  const d: any = input || {};
  const rt_rw_raw = String(d.rt_rw || "").replace(/\s+/g, "");
  const rt_rw = /^\d{3}\/\d{3}$/.test(rt_rw_raw)
    ? rt_rw_raw
    : (() => {
        // try to auto-format like "1/2" -> "001/002"
        const m = rt_rw_raw.match(/^(\d{1,3})\/(\d{1,3})$/);
        if (m) return m[1].padStart(3,"0") + "/" + m[2].padStart(3,"0");
        return "000/000";
      })();

  const nik = /^\d{16}$/.test(String(d.nik || "")) ? String(d.nik) : "";

  return {
    is_ktp: Boolean(d.is_ktp) === true,
    nik,
    nama: String(d.nama || "").trim(),
    tempat_lahir: String(d.tempat_lahir || "").trim(),
    tanggal_lahir: safeDateOrEmpty(d.tanggal_lahir),
    jenis_kelamin: VALID_JK.includes(String(d.jenis_kelamin || "").toUpperCase()) ? String(d.jenis_kelamin).toUpperCase() : "",
    golongan_darah: VALID_GOLONGAN.includes(String(d.golongan_darah || "").toUpperCase()) ? String(d.golongan_darah).toUpperCase() : "",
    alamat: String(d.alamat || "").trim(),
    rt_rw,
    kel_desa: String(d.kel_desa || "").trim(),
    kecamatan: String(d.kecamatan || "").trim(),
    kabupaten_kota: String(d.kabupaten_kota || "").trim(),
    provinsi: String(d.provinsi || "").trim(),
    tempat_dikeluarkan: String(d.tempat_dikeluarkan || "").trim(),
    tanggal_dikeluarkan: safeDateOrEmpty(d.tanggal_dikeluarkan),
    masa_berlaku: safeDateOrEmpty(d.masa_berlaku),
    agama: String(d.agama || "").trim(),
    status_perkawinan: VALID_STATUS.includes(String(d.status_perkawinan || "").toUpperCase()) ? String(d.status_perkawinan).toUpperCase() : "",
    pekerjaan: String(d.pekerjaan || "").trim(),
    kewarganegaraan: VALID_WN.includes(String(d.kewarganegaraan || "").toUpperCase()) ? String(d.kewarganegaraan).toUpperCase() : "",
  };
}

function extractDateFromText(text: string): string {
  const d1 = text.match(/(\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b)/);
  if (d1) {
    const raw = d1[1].replace(/\//g,"-");
    const parts = raw.split("-");
    if (parts[2].length === 4) {
      const dd = parts[0].padStart(2,"0"), mm = parts[1].padStart(2,"0"), yyyy = parts[2];
      const candidate = `${dd}-${mm}-${yyyy}`;
      return isDateDDMMYYYY(candidate) ? candidate : "";
    }
  }
  const d2 = text.match(/(\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b)/);
  if (d2) {
    const [y,m,d] = d2[1].replace(/\//g,"-").split("-");
    const candidate = `${d.padStart(2,"0")}-${m.padStart(2,"0")}-${y}`;
    return isDateDDMMYYYY(candidate) ? candidate : "";
  }
  return "";
}

function extractPlaceFromText(text: string): string {
  const mProv = text.match(/Provinsi[:\s]+([A-Z\s]+)/i);
  if (mProv) return mProv[1].trim();
  const mKab = text.match(/(Kabupaten|Kota)[:\s]+([A-Z\s]+)/i);
  if (mKab) return mKab[2].trim();
  return "";
}