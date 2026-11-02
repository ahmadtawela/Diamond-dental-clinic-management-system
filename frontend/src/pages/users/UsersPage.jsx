import { useEffect, useState } from "react";
import { UserCog, Plus, Pencil } from "lucide-react";
import api from "../../api/client";
import { Button, Card, Input, PageHeader, EmptyState, Modal, Select, Badge } from "../../components/ui";
import { Localized } from "../../context/LocaleContext";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/users");
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get("/roles").then(({ data }) => setRoles(data));
  }, []);

  return (
    <Localized>
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Manage staff accounts and what each role can access"
        action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New user</Button>}
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center text-ink-secondary text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <EmptyState icon={UserCog} title="No users yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b border-border">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{u.full_name}</td>
                  <td className="px-5 py-3 text-ink-secondary">{u.email}</td>
                  <td className="px-5 py-3 capitalize">{u.role?.name}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.is_active ? "success" : "neutral"}>{u.is_active ? "active" : "inactive"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditingUser(u)} className="text-ink-secondary hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} roles={roles} onSaved={load} />
      <EditUserModal open={!!editingUser} user={editingUser} onClose={() => setEditingUser(null)} roles={roles} onSaved={load} />
    </div>
    </Localized>
  );
}

function EditUserModal({ open, user, onClose, roles, onSaved }) {
  const [form, setForm] = useState({ full_name: "", phone: "", role_id: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && open) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        role_id: user.role_id ?? user.role?.id ?? "",
        is_active: !!user.is_active,
      });
    }
  }, [user, open]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, form);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title={`Edit ${user.full_name}`}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Select label="Role" required value={form.role_id} onChange={(e) => set("role_id", e.target.value)}>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Account is active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

function CreateUserModal({ open, onClose, roles, onSaved }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role_id: "", specialty: "", license_number: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const selectedRole = roles.find((r) => String(r.id) === String(form.role_id));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.post("/users", form);
      onSaved();
      onClose();
      setForm({ full_name: "", email: "", phone: "", password: "", role_id: "", specialty: "", license_number: "" });
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Create a user">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} error={errors.full_name?.[0]} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email?.[0]} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Temporary password" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password?.[0]} />
        </div>
        <Select label="Role" required value={form.role_id} onChange={(e) => set("role_id", e.target.value)}>
          <option value="">— select —</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
        </Select>
        {selectedRole?.name === "doctor" && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Specialty" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
            <Input label="License number" value={form.license_number} onChange={(e) => set("license_number", e.target.value)} />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create user"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}
