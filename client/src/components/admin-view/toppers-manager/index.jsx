import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTopperService,
  deleteTopperService,
  fetchToppersService,
  updateTopperService,
  mediaUploadService,
} from "@/services";
import { Plus, Trash2, Edit, Upload } from "lucide-react";

function AdminToppersManager() {
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rollno, setRollno] = useState("");
  const [year, setYear] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [marks, setMarks] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function loadToppers() {
    setLoading(true);
    try {
      const res = await fetchToppersService();
      if (res?.success) setToppers(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadToppers();
  }, []);

  function resetForm() {
    setEditingId(null);
    setRollno("");
    setYear("");
    setName("");
    setImage("");
    setMarks("");
    setImageFile(null);
  }

  function handleEdit(topper) {
    setEditingId(topper._id);
    setRollno(topper.rollno || "");
    setYear(topper.year || "");
    setName(topper.name || "");
    setImage(topper.image || "");
    setMarks(String(topper.marks || ""));
    setImageFile(null);
  }

  async function handleFileUpload(file) {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await mediaUploadService(formData, (progress) => {
        console.log("Upload progress:", progress);
      });
      
      if (response?.success) {
        setImage(response.data.url);
        setImageFile(file);
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!rollno || !year || !name || !image || !marks) {
      alert("All fields including marks and image are required");
      return;
    }
    const payload = { rollno, year, name, image, marks: Number(marks) };
    const res = editingId
      ? await updateTopperService(editingId, payload)
      : await createTopperService(payload);
    if (res?.success) {
      resetForm();
      loadToppers();
    } else {
      alert(res?.message || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this topper?")) return;
    const res = await deleteTopperService(id);
    if (res?.success) loadToppers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Plus className="h-8 w-8" />
          Institute Toppers
        </h2>
        <p className="text-gray-600 mt-2">
          Manage institute toppers with their details and images.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editingId ? "Edit topper" : "Add topper"}</CardTitle>
          {editingId ? (
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Roll No</Label>
              <Input
                value={rollno}
                onChange={(e) => setRollno(e.target.value)}
                placeholder="e.g. 2021001"
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2023"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 95"
              />
            </div>
            <div>
              <Label>Image Upload</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
                {image && (
                  <div className="flex items-center gap-2">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                    <span className="text-sm text-green-600">
                      {imageFile ? "Image uploaded successfully" : "Current image"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleSave}>
            {editingId ? "Update" : "Add"} Topper
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Toppers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : toppers.length === 0 ? (
            <p>No toppers added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {toppers.map((topper) => (
                <div key={topper._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
                  <div className="w-full h-64 overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img
                      src={topper.image}
                      alt={topper.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="w-full flex-1 flex flex-col justify-between p-4">
                    <h3 className="font-semibold text-lg">{topper.name}</h3>
                    <p className="text-sm text-gray-600">
                      Roll No: {topper.rollno}
                    </p>
                    <p className="text-sm text-gray-600">Year: {topper.year}</p>
                    <p className="text-sm font-bold text-blue-600 mt-2">
                      Marks: {topper.marks}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(topper)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(topper._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminToppersManager;
