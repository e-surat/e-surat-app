export type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Umum",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/surat-masuk", label: "Surat Masuk", icon: "inbox" },
      { href: "/surat-keluar", label: "Surat Keluar", icon: "send" },
      { href: "/disposisi", label: "Disposisi", icon: "share" },
      { href: "/arsip", label: "Arsip & Pencarian", icon: "folder" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { href: "/laporan", label: "Laporan & Rekap", icon: "report" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/pengaturan", label: "Pengaturan", icon: "gear", adminOnly: true },
      { href: "/audit", label: "Audit Trail", icon: "history", adminOnly: true },
    ],
  },
];
