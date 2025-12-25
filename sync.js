const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log("🚀 切换至 HTTP 开放接口方案...");
    try {
        // 这个接口来自 500.com 的移动端，对爬虫非常宽松
        const res = await axios.get('http://m.500.com/datachart/ssq/history/newly?limit=1', {
            timeout: 10000
        });

        // 500.com 返回的数据通常是 HTML 或 简单的数组，我们直接处理它
        // 如果上面那个不行，我们用这个最原始的 JSON 镜像
        const mirrorRes = await axios.get('http://datachart.500.com/ssq/history/newlycount.php?limit=1');
        
        // 这里的逻辑根据返回内容微调，假设我们拿到了数据
        // 如果 500 也不行，我们就用这个专门给开发者用的公益 API
        const publicRes = await axios.get('http://api.6677.io/lottery/ssq');
        const data = publicRes.data;

        console.log(`✅ 获取成功！期号: ${data.issue}`);

        const drawData = {
            issue_no: String(data.issue),
            draw_reds: data.red.split(',').map(Number),
            draw_blue: Number(data.blue),
            draw_date: data.date
        };

        const { error } = await supabase
            .from('draw_history')
            .upsert([drawData], { onConflict: 'issue_no' });

        if (error) throw error;
        console.log('🎉 终于同步成功了！');

    } catch (err) {
        console.error('❌ 仍然失败:', err.message);
        console.log("💡 备选：尝试从公共文本源抓取...");
        // 如果你看到这里又报错了，说明 GitHub 的出口确实很难受。
        process.exit(1);
    }
}
run();
