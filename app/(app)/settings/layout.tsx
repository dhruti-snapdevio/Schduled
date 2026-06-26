import { SettingsNav, SettingsMobileNav } from "./_components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile horizontal scroll nav */}
      <div className="mb-6 md:hidden">
        <SettingsMobileNav />
      </div>

      <div className="flex items-start gap-8">
        <aside className="hidden w-48 shrink-0 md:block md:sticky md:top-6 md:self-start">
          <SettingsNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
