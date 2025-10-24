export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { accessCode } = req.body;
  // Ambil kode akses rahasia dari environment variables
  const REAL_ACCESS_CODE = process.env.ACCESS_CODE;

  if (!REAL_ACCESS_CODE) {
    // Error jika server tidak dikonfigurasi dengan benar
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Bandingkan kode
  if (accessCode === REAL_ACCESS_CODE) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid access code' });
  }
}

