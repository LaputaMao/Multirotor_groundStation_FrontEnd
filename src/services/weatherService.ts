// src/services/weatherService.ts
import axios from 'axios';

// 定义接口
export interface WeatherDaily {
    dateStr: string;
    dayName: string;
    type: 'sunny' | 'foggy' | 'light_rain' | 'heavy_rain';
    tempMax: number;
    tempMin: number;
}

export interface LocationInfo {
    city: string; // 市
    district: string; // 县/区
}

// WMO Weather Codes (Open-Meteo 使用的标准气象代码)
const mapWmoCodeToType = (code: number): WeatherDaily['type'] => {
    // 0: 晴天
    // 1, 2, 3: 多云
    if (code <= 3) return 'sunny';

    // 45, 48: 雾
    if (code === 45 || code === 48) return 'foggy';

    // 51-67: 小雨/冻雨
    // 80-82: 阵雨
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'light_rain';

    // 71-77: 雪 (这里暂时归为大雨样式或者你可以加雪的样式)
    // 95-99: 雷暴
    if (code >= 71) return 'heavy_rain';

    return 'sunny'; // 默认
};

// 1. 获取地理位置名称 (使用 OSM Nominatim 服务)
export const fetchLocationName = async (lat: number, lon: number): Promise<LocationInfo> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh-CN`;
        const res = await axios.get(url);
        const addr = res.data.address;

        // 这里尝试提取 县/区 > 市 > 州
        return {
            city: addr.city || addr.state || '未知地区',
            district: addr.county || addr.district || addr.town || ''
        };
    } catch (e) {
        console.error("Geocoding fetch failed", e);
        return {city: '未知', district: '通讯中断'};
    }
};

// 2. 获取未来7天天气 (使用 Open-Meteo)
export const fetchWeatherForecast = async (lat: number, lon: number): Promise<WeatherDaily[]> => {
    try {
        // 请求参数: 每日天气代码, 最高温, 最低温, 自动时区
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await axios.get(url);
        const daily = res.data.daily;

        const result: WeatherDaily[] = [];
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        // 遍历返回的数据 (Open-Meteo 返回的是数组)
        for (let i = 0; i < daily.time.length; i++) {
            const date = new Date(daily.time[i]);
            // 处理显示名称：今天/明天/周X
            const today = new Date();
            const isToday = date.getDate() === today.getDate();
            const isTmrrw = date.getDate() === today.getDate() + 1;

            let dayName = weekDays[date.getDay()];
            if (isToday) dayName = '今天';
            if (isTmrrw) dayName = '明天';

            result.push({
                dateStr: `${date.getMonth() + 1}月${date.getDate()}日`,
                dayName: dayName,
                type: mapWmoCodeToType(daily.weathercode[i]),
                tempMax: Math.round(daily.temperature_2m_max[i]),
                tempMin: Math.round(daily.temperature_2m_min[i])
            });
        }
        return result;
    } catch (e) {
        console.error("Weather fetch failed", e);
        return [];
    }
};
