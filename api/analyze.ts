import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ 
      error: "GEMINI_API_KEY is not configured on Vercel. Please add GEMINI_API_KEY to your Vercel project's Environment Variables (Settings > Environment Variables)." 
    });
  }

  const { stats } = req.body;
  if (!stats) {
    return res.status(400).json({ error: "Missing statistical data for analysis." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const dataContext = JSON.stringify(stats, null, 2);

    const prompt = `
Bạn là một Chuyên gia Phân tích Dữ liệu Kinh doanh (Business Data Analyst) và là Giám đốc Chiến lược cho các giải chạy Marathon quy mô lớn.

Dưới đây là dữ liệu thống kê từ hệ thống quản lý giải chạy hiện tại:
\`\`\`json
${dataContext}
\`\`\`

Nhiệm vụ của bạn: Hãy đọc và phân tích kỹ các số liệu thống kê ở trên để lập một BÁO CÁO ĐÁNH GIÁ HIỆU SUẤT & ĐỀ XUẤT CHIẾN LƯỢC. Báo cáo cần chia rõ thành các mục sau:

1. Đánh giá Doanh thu & Cự ly Mũi nhọn:
- Giải chạy nào đang là "gà đẻ trứng vàng" mang lại doanh thu lớn nhất? Cự ly nào (5KM, 10KM, 21KM, 42KM) đang đóng góp dòng tiền mạnh nhất hệ thống?
- Có cự ly nào có lượng người đăng ký ít nhưng doanh thu mang lại lại cao đột biến không?

2. Phân tích Hành vi Mua vé (Sales Stages):
- Nhận xét về việc lượng vé tập trung khổng lồ ở giai đoạn "Super Early Bird" và sụt giảm mạnh ở các giai đoạn sau. Điều này phản ánh tâm lý gì của runner và ảnh hưởng thế nào đến dòng tiền (Cash flow) của ban tổ chức?
- Phân tích trường hợp đặc biệt của giải AS26 (chỉ bán ở "Giai đoạn duy nhất") và giải SS26 (có lượng BIB lớn ở bảng cự ly nhưng doanh thu bằng 0 ở bảng doanh thu). Hãy đưa ra các giả thuyết vận hành cho 2 trường hợp này.

3. Chân dung Khách hàng & Cơ hội Tài trợ (Demographics):
- Dựa trên dữ liệu Nhóm tuổi (Độ tuổi nào chiếm doanh thu cao nhất?) và Giới tính (Tỷ lệ Nam/Nữ), hãy phác họa chân dung khách hàng mục tiêu lý tưởng.
- Đề xuất 3 ý tưởng/hoạt động truyền thông hoặc gói quyền lợi để thu hút thêm runner Nữ và nhóm tuổi trẻ (18-24).

4. Địa lý & Chiến lược B2B:
- Nhận xét về top các tỉnh thành có lượng runner đông đảo (Tây Ninh, Đồng Tháp, Vĩnh Long...). Ban tổ chức nên làm gì để tối ưu khâu hậu cần (Logistics) hoặc kích cầu du lịch địa phương?
- Với việc đăng ký Nhóm/Doanh nghiệp chiếm tỉ lệ lớn, hãy đề xuất chiến lược B2B chi tiết để giữ chân và mở rộng tệp khách hàng doanh nghiệp này cho mùa giải sau.

Yêu cầu về kỹ năng đầu ra:
- Phân tích sâu sắc, có số liệu dẫn chứng cụ thể từ dữ liệu được cung cấp ở trên (không nói chung chung).
- Nhìn ra được các "điểm nghẽn" hoặc "bất thường" trong vận hành dựa trên số liệu.
- Trình bày rõ ràng bằng tiếng Việt dưới dạng Markdown có cấu trúc chuyên nghiệp, sử dụng các tiêu đề, bảng tóm tắt hoặc bullet point để dễ theo dõi.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ analysis: response.text });
  } catch (err: any) {
    console.error("Gemini analysis failed on Vercel:", err);
    return res.status(500).json({ error: "Phân tích dữ liệu bằng AI thất bại: " + err.message });
  }
}
