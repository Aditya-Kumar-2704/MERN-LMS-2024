import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteUserService,
  fetchAllUsersService,
  updateUserRoleService,
} from "@/services";
import { Check, Trash2, Users } from "lucide-react";

function AdminUsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState({});

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetchAllUsersService();

      if (response?.success) {
        setUsers(response.data || []);
        const rolesMap = {};

        (response.data || []).forEach((user) => {
          rolesMap[user._id] = user.role;
        });

        setSelectedRoles(rolesMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleUpdate(userId, role) {
    try {
      const response = await updateUserRoleService(userId, role);

      if (response?.success) {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user._id === userId ? { ...user, role } : user
          )
        );
        setSelectedRoles((currentRoles) => ({
          ...currentRoles,
          [userId]: role,
        }));
        return;
      }

      alert(response?.message || "Failed to update role");
    } catch (error) {
      console.error("Error updating role:", error);
      alert(error?.response?.data?.message || "Error updating role");
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Delete ${userName}?`)) {
      return;
    }

    try {
      const response = await deleteUserService(userId);

      if (response?.success) {
        setUsers((currentUsers) =>
          currentUsers.filter((user) => user._id !== userId)
        );
        return;
      }

      alert(response?.message || "Failed to delete user");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error?.response?.data?.message || "Error deleting user");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
          <Users className="h-8 w-8" />
          User management
        </h2>
        <p className="mt-2 text-slate-300">
          Manage student and instructor accounts. Admin role cannot be changed here.
        </p>
      </div>

      <Card className="border-white/10 bg-[#0b1b2d] text-white">
        <CardHeader>
          <CardTitle>All users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No users found</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Current role</TableHead>
                    <TableHead className="text-slate-300">Change role</TableHead>
                    <TableHead className="text-right text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user._id}
                      className="border-white/10 hover:bg-white/[0.03]"
                    >
                      <TableCell className="font-medium text-white">
                        {user.userName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.userEmail}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-amber-400/20 text-amber-200"
                              : user.role === "instructor"
                                ? "bg-sky-400/20 text-sky-200"
                                : "bg-emerald-400/20 text-emerald-200"
                          }`}
                        >
                          {user.role === "user"
                            ? "Student"
                            : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <span className="text-sm text-slate-500">Locked</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRoles[user._id] || user.role}
                              onChange={(event) =>
                                setSelectedRoles((currentRoles) => ({
                                  ...currentRoles,
                                  [user._id]: event.target.value,
                                }))
                              }
                              className="rounded-md border border-white/10 bg-[#10253d] px-3 py-2 text-sm text-white"
                            >
                              <option value="user">Student</option>
                              <option value="instructor">Instructor</option>
                            </select>

                            {selectedRoles[user._id] !== user.role ? (
                              <Button
                                size="sm"
                                className="bg-emerald-500 text-white hover:bg-emerald-400"
                                onClick={() =>
                                  handleRoleUpdate(user._id, selectedRoles[user._id])
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role === "admin" ? (
                          <span className="text-sm text-slate-500">Locked</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                            onClick={() => handleDeleteUser(user._id, user.userName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsersManager;
