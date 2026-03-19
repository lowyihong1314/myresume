import type {
  EasyPosMerchantAccess,
  EasyPosMerchantMember,
} from "../../data/easyposApi.ts";
import type { Dispatch, SetStateAction } from "react";
import type { MerchantProfile } from "../../data/easyposMerchantStore.ts";
import type { EasyPosSettings } from "../../data/easyposSettingsStore.ts";
import { GlassPanel, PosField } from "./shared";

type EasyPosSettingsPageProps = {
  merchants: EasyPosMerchantAccess[];
  selectedMerchantId: number | null;
  merchantName: string;
  merchantRole: string;
  merchantForm: MerchantProfile;
  createMerchantForm: MerchantProfile;
  merchantMembers: EasyPosMerchantMember[];
  memberUsername: string;
  setMerchantForm: Dispatch<SetStateAction<MerchantProfile>>;
  setCreateMerchantForm: Dispatch<SetStateAction<MerchantProfile>>;
  setMemberUsername: Dispatch<SetStateAction<string>>;
  settings: EasyPosSettings;
  setSettings: Dispatch<SetStateAction<EasyPosSettings>>;
  onSelectMerchant: (merchantId: number) => void;
  onCreateMerchant: () => void;
  onAddMember: () => void;
  onRemoveMember: (member: EasyPosMerchantMember) => void;
  onRemoveMerchant: () => void;
  onBack: () => void;
  onSave: () => void;
  onExit: () => void;
};

export function EasyPosSettingsPage({
  merchants,
  selectedMerchantId,
  merchantName,
  merchantRole,
  merchantForm,
  createMerchantForm,
  merchantMembers,
  memberUsername,
  setMerchantForm,
  setCreateMerchantForm,
  setMemberUsername,
  settings,
  setSettings,
  onSelectMerchant,
  onCreateMerchant,
  onAddMember,
  onRemoveMember,
  onRemoveMerchant,
  onBack,
  onSave,
  onExit,
}: EasyPosSettingsPageProps) {
  return (
    <section className="easypos-settings-page mt-6">
      <GlassPanel className="easypos-settings-shell">
        <div className="easypos-settings-toolbar sticky top-4 z-20 -mx-2 rounded-[24px] border border-[var(--easypos-border)] bg-[color:var(--easypos-modal-bg)]/95 px-4 py-4 backdrop-blur md:mx-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Settings
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--easypos-text)]">
                EasyPos Settings
              </h2>
              <p className="mt-2 text-sm text-[var(--easypos-muted)]">
                Merchant: {merchantName} · {merchantRole}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3 text-sm font-bold text-[var(--easypos-text)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSave}
                className="rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)]"
              >
                Save Settings
              </button>
              <button
                type="button"
                onClick={onExit}
                className="col-span-2 rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-danger-muted)] px-4 py-3 text-sm font-bold text-[var(--easypos-danger)] sm:col-auto"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        <div className="easypos-settings-theme mt-6 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--easypos-text)]">Dark Mode</p>
              <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                Toggle EasyPos color variables between dark and light themes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, darkMode: !current.darkMode }))}
              className={`easypos-settings-theme-toggle rounded-xl px-4 py-3 text-sm font-bold ${
                settings.darkMode
                  ? "bg-[var(--easypos-button-primary)] text-[var(--easypos-button-primary-text)]"
                  : "border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-[var(--easypos-text)]"
              }`}
            >
              {settings.darkMode ? "Dark" : "Light"}
            </button>
          </div>
        </div>

        <div className="easypos-settings-merchant-switch mt-6 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-5">
          <p className="text-sm font-bold text-[var(--easypos-text)]">Switch Merchant</p>
          <p className="mt-1 text-sm text-[var(--easypos-muted)]">
            Change the active merchant without leaving EasyPos.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {merchants.map((merchant) => (
              <button
                key={merchant.id}
                type="button"
                onClick={() => onSelectMerchant(merchant.id)}
                className={`rounded-2xl border px-4 py-4 text-left ${
                  selectedMerchantId === merchant.id
                    ? "border-[var(--easypos-accent)] bg-[var(--easypos-panel)]"
                    : "border-[var(--easypos-border)] bg-[var(--easypos-button-muted)]"
                }`}
              >
                <p className="text-sm font-bold text-[var(--easypos-text)]">{merchant.name}</p>
                <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                  {merchant.role} · owner #{merchant.merchant_owner_id}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="easypos-settings-merchant-grid mt-6 grid gap-4 md:grid-cols-2">
          <PosField
            label="Merchant Name"
            value={merchantForm.name}
            onChange={(event) =>
              setMerchantForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Merchant name"
            inputClassName="easypos-merchant-name"
          />
          <PosField
            label="Registration Number"
            value={merchantForm.registrationNumber}
            onChange={(event) =>
              setMerchantForm((current) => ({
                ...current,
                registrationNumber: event.target.value,
              }))
            }
            placeholder="SSM / Registration"
            inputClassName="easypos-merchant-registration"
          />
          <PosField
            label="Phone"
            value={merchantForm.phone}
            onChange={(event) =>
              setMerchantForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="+60..."
            inputClassName="easypos-merchant-phone"
          />
          <PosField
            label="Email"
            value={merchantForm.email}
            onChange={(event) =>
              setMerchantForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="merchant@example.com"
            inputClassName="easypos-merchant-email"
          />
          <label className="easypos-field easypos-merchant-address md:col-span-2 flex flex-col gap-2">
            <span className="easypos-field-label text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Address
            </span>
            <textarea
              value={merchantForm.address}
              onChange={(event) =>
                setMerchantForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Merchant address"
              rows={3}
              className="easypos-field-input rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none transition focus:border-[var(--easypos-accent)]"
            />
          </label>
          <label className="easypos-field easypos-merchant-footer md:col-span-2 flex flex-col gap-2">
            <span className="easypos-field-label text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Receipt Footer
            </span>
            <textarea
              value={merchantForm.footerNote}
              onChange={(event) =>
                setMerchantForm((current) => ({ ...current, footerNote: event.target.value }))
              }
              placeholder="Thank you note"
              rows={2}
              className="easypos-field-input rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none transition focus:border-[var(--easypos-accent)]"
            />
          </label>
        </div>

        <div className="easypos-settings-members mt-6 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--easypos-text)]">Merchant Members</p>
              <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                Owner can invite other registered users by username.
              </p>
            </div>
            <span className="rounded-full bg-[var(--easypos-accent-badge)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--easypos-accent-soft)]">
              {merchantMembers.length} member(s)
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {merchantMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--easypos-border)] px-4 py-5 text-sm text-[var(--easypos-muted)]">
                No merchant members yet.
              </div>
            ) : (
              merchantMembers.map((member) => (
                <div
                  key={`${member.userId}-${member.role}`}
                  className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-panel)] px-4 py-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--easypos-text)]">
                        {member.displayName || member.username}
                      </p>
                      <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                        @{member.username}
                        {member.email ? ` · ${member.email}` : ""}
                        {member.phone ? ` · ${member.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[var(--easypos-button-muted)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--easypos-text)]">
                        {member.role}
                      </span>
                      {merchantRole === "owner" && member.role !== "owner" ? (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member)}
                          className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-danger-muted)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--easypos-danger)]"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {merchantRole === "owner" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <PosField
                label="Add Member By Username"
                value={memberUsername}
                onChange={(event) => setMemberUsername(event.target.value)}
                placeholder="registered_username"
                inputClassName="easypos-add-member-username"
              />
              <div className="md:self-end">
                <button
                  type="button"
                  onClick={onAddMember}
                  className="w-full rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)] md:w-auto"
                >
                  Add Member
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="easypos-settings-create-merchant mt-6 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-5">
          <p className="text-sm font-bold text-[var(--easypos-text)]">Add Merchant</p>
          <p className="mt-1 text-sm text-[var(--easypos-muted)]">
            Create another merchant without leaving EasyPos.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PosField
              label="Merchant Name"
              value={createMerchantForm.name}
              onChange={(event) =>
                setCreateMerchantForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Merchant name"
              inputClassName="easypos-create-merchant-name"
            />
            <PosField
              label="Registration Number"
              value={createMerchantForm.registrationNumber}
              onChange={(event) =>
                setCreateMerchantForm((current) => ({
                  ...current,
                  registrationNumber: event.target.value,
                }))
              }
              placeholder="SSM / Registration"
              inputClassName="easypos-create-merchant-registration"
            />
            <PosField
              label="Phone"
              value={createMerchantForm.phone}
              onChange={(event) =>
                setCreateMerchantForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="+60..."
              inputClassName="easypos-create-merchant-phone"
            />
            <PosField
              label="Email"
              value={createMerchantForm.email}
              onChange={(event) =>
                setCreateMerchantForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="merchant@example.com"
              inputClassName="easypos-create-merchant-email"
            />
            <label className="easypos-field easypos-create-merchant-address md:col-span-2 flex flex-col gap-2">
              <span className="easypos-field-label text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
                Address
              </span>
              <textarea
                value={createMerchantForm.address}
                onChange={(event) =>
                  setCreateMerchantForm((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="Merchant address"
                rows={3}
                className="easypos-field-input rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none transition focus:border-[var(--easypos-accent)]"
              />
            </label>
            <label className="easypos-field easypos-create-merchant-footer md:col-span-2 flex flex-col gap-2">
              <span className="easypos-field-label text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
                Receipt Footer
              </span>
              <textarea
                value={createMerchantForm.footerNote}
                onChange={(event) =>
                  setCreateMerchantForm((current) => ({ ...current, footerNote: event.target.value }))
                }
                placeholder="Thank you note"
                rows={2}
                className="easypos-field-input rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none transition focus:border-[var(--easypos-accent)]"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={onCreateMerchant}
                className="rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)]"
              >
                Create Merchant
              </button>
            </div>
          </div>
        </div>

        <div className="easypos-settings-actions mt-6 flex flex-wrap justify-between gap-3">
          {merchantRole === "owner" ? (
            <button
              type="button"
              onClick={onRemoveMerchant}
              className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-danger-muted)] px-5 py-3 text-sm font-bold text-[var(--easypos-danger)]"
            >
              Remove Merchant
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)]"
          >
            Save Settings
          </button>
        </div>
      </GlassPanel>
    </section>
  );
}
