// Cloudflare Worker 脚本：从 Gitee 抓取代码文件（正文内错误检测版）
export default {
    async fetch(request, env, ctx) {
        // 设置 CORS 头部
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // 处理 OPTIONS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const code = url.searchParams.get('code');

        if (!code) {
            return new Response(JSON.stringify({
                error: '请提供 code 参数，例如 ?code=P1029',
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const owner = 'jimmyflower6';
        const repo = 'zsyz-jimmy';
        const branch = 'master';
        const filePath = `code/${code}.cpp`;
        const rawUrl = `https://raw.giteeusercontent.com/${owner}/${repo}/raw/${branch}/${filePath}`;

        try {
            const response = await fetch(rawUrl, {
                headers: { 'User-Agent': 'Cloudflare-Worker-Gitee-Fetcher/1.0' },
            });

            // 先获取响应正文文本
            const text = await response.text();

            // 🔍 关键修改：通过正文内容判断是否为文件未找到
            if (text.includes('Repository or file not found')) {
                return new Response(JSON.stringify({
                    error: 'Repository or file not found',
                    code: code,
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                });
            }

            // 其他情况视为正常文件内容，直接返回
            return new Response(text, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    ...corsHeaders,
                },
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: `请求失败: ${error.message}`,
                code: code,
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    },
};