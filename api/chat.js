export default async function handler(req, res) {
    // 仅允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { situation, mbti } = req.body;

    // 将 System Prompt 放在后端，前端不可见，更加安全
    const systemPrompt = `你是一个精通荣格八维和MBTI的心理推演专家。客观、极简、禁止煽情。必须返回纯JSON格式，严禁包含Markdown代码块标识。
                推演要求：针对设定的情境和主角性格，直接推演其心理运作。
                注意：
                1. 描述必须直接进入分析核心，禁止使用“XX功能启动/激活”、“通过XX功能...”等开场白，请直接描述具体的认知逻辑。
                2. functions 的 role 字段必须依次为："1st 主导功能"、"2nd 辅助功能"、"3rd 第三功能"、"4th 劣势功能"。
                3. shadowFunctions 的 role 字段必须依次为："5th 对立功能"、"6th 批判功能"、"7th 盲点功能"、"8th 恶魔功能"。
                4. name 字段请写出英文缩写及中文全称，如 "Ni (内倾直觉)"。
                JSON结构：{ 
                    "coreReaction": "一句话核心反应", 
                    "functions": [{"role": "序号+职能中文", "name": "缩写(全称)", "desc": "描述具体想法(少于30字)"}], 
                    "behaviors": ["行为预测"], 
                    "advice": {"action": "具体建议", "psychology": "心态参考"}, 
                    "shadowFunctions": [{"role": "序号+职能中文", "name": "缩写(全称)", "desc": "描述具体想法(少于30字)"}] 
                }`;

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 这里使用 Vercel 的环境变量
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `情境：${situation}\n主角：${mbti}` }
                ],
                stream: false,
                response_format: { "type": "json_object" }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'DeepSeek API 请求失败');
        }

        // 将结果透传回前端
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
}
