
import * as echarts from 'echarts/core';

import { BarChart,PieChart,LineChart,GaugeChart} from 'echarts/charts';
// Import title, tooltip, grid, dataset, built-in data transformer (all suffixed with Component)
import {
    TooltipComponent,
    GridComponent,
} from 'echarts/components';
// Label auto-layout, global transition animation, etc.
// Import Canvas renderer. Importing CanvasRenderer or SVGRenderer is required.
import { CanvasRenderer } from 'echarts/renderers';
import { LegendComponent } from 'echarts/components';
// Register required components
echarts.use([
    GaugeChart,
    LegendComponent,
    PieChart,
    TooltipComponent,
    GridComponent,
    BarChart,
    LineChart,
    CanvasRenderer
]);

export default echarts