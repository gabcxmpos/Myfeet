// Mapeamento de ícones disponíveis para equipamentos
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Droplet,
  Volume2,
  Video,
  Router,
  Printer,
  Receipt,
  ScanLine,
  Droplets,
  Radio,
  Tv,
  HardDrive,
  Server,
  Wifi,
  Camera,
  Headphones,
  Keyboard,
  Mouse,
  Speaker,
  Mic,
  Cpu,
  MemoryStick,
  Power,
  Zap,
  Settings,
  Wrench,
  Box
} from 'lucide-react';

// Ícones disponíveis para seleção (cerca de 20+ ícones)
export const availableIcons = [
  { name: 'Smartphone', icon: Smartphone, label: 'Smartphone' },
  { name: 'Tablet', icon: Tablet, label: 'Tablet' },
  { name: 'Laptop', icon: Laptop, label: 'Laptop' },
  { name: 'Monitor', icon: Monitor, label: 'Monitor' },
  { name: 'Droplet', icon: Droplet, label: 'Steamer/Gota' },
  { name: 'Volume2', icon: Volume2, label: 'Som/Alto-falante' },
  { name: 'Video', icon: Video, label: 'Vídeo/Câmera' },
  { name: 'Router', icon: Router, label: 'Roteador/Moldem' },
  { name: 'Printer', icon: Printer, label: 'Impressora' },
  { name: 'Receipt', icon: Receipt, label: 'Máquina Fiscal' },
  { name: 'ScanLine', icon: ScanLine, label: 'Leitor de Código' },
  { name: 'Droplets', icon: Droplets, label: 'Tanque/Água' },
  { name: 'Radio', icon: Radio, label: 'Rádio' },
  { name: 'Tv', icon: Tv, label: 'TV' },
  { name: 'HardDrive', icon: HardDrive, label: 'HD/Disco' },
  { name: 'Server', icon: Server, label: 'Servidor' },
  { name: 'Wifi', icon: Wifi, label: 'WiFi' },
  { name: 'Camera', icon: Camera, label: 'Câmera' },
  { name: 'Headphones', icon: Headphones, label: 'Fone de Ouvido' },
  { name: 'Keyboard', icon: Keyboard, label: 'Teclado' },
  { name: 'Mouse', icon: Mouse, label: 'Mouse' },
  { name: 'Speaker', icon: Speaker, label: 'Caixa de Som' },
  { name: 'Mic', icon: Mic, label: 'Microfone' },
  { name: 'Cpu', icon: Cpu, label: 'CPU' },
  { name: 'MemoryStick', icon: MemoryStick, label: 'Memória' },
  { name: 'Power', icon: Power, label: 'Energia' },
  { name: 'Zap', icon: Zap, label: 'Elétrico' },
  { name: 'Settings', icon: Settings, label: 'Configurações' },
  { name: 'Wrench', icon: Wrench, label: 'Ferramenta' },
  { name: 'Box', icon: Box, label: 'Caixa' }
];

// Função para obter ícone por nome
export const getIconByName = (iconName) => {
  const iconData = availableIcons.find(icon => icon.name === iconName);
  return iconData ? iconData.icon : Smartphone; // Default
};

// Tipos pré-definidos com seus ícones
export const defaultEquipmentTypes = [
  { value: 'CELULAR', label: 'Celular', iconName: 'Smartphone', color: 'text-blue-500' },
  { value: 'TABLET', label: 'Tablet', iconName: 'Tablet', color: 'text-purple-500' },
  { value: 'NOTEBOOK', label: 'Notebook', iconName: 'Laptop', color: 'text-green-500' },
  { value: 'MINI_PC', label: 'Mini PC', iconName: 'Monitor', color: 'text-orange-500' },
  { value: 'STEAMER', label: 'Steamer', iconName: 'Droplet', color: 'text-cyan-500' },
  { value: 'APARELHO_DE_SOM', label: 'Aparelho de Som', iconName: 'Volume2', color: 'text-pink-500' },
  { value: 'DVR', label: 'DVR', iconName: 'Video', color: 'text-indigo-500' },
  { value: 'MOLDEM', label: 'Moldem', iconName: 'Router', color: 'text-teal-500' },
  { value: 'MAQUINA_ZEBRA', label: 'Máquina Zebra', iconName: 'Printer', color: 'text-yellow-500' },
  { value: 'MAQUINA_FISCAL', label: 'Máquina Fiscal', iconName: 'Receipt', color: 'text-red-500' },
  { value: 'LEITOR_CODIGO_BARRAS', label: 'Leitor de Código de Barras', iconName: 'ScanLine', color: 'text-emerald-500' },
  { value: 'TANQUE', label: 'Tanque', iconName: 'Droplets', color: 'text-blue-600' }
];
