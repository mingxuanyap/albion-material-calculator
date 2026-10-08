import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'阿尔比恩装备制作计算器',description:'中文装备搜索、制作材料、返还及银币利润计算'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
