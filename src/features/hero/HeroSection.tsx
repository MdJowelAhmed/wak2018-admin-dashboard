import { useMemo, useState, useEffect, useRef } from "react";
import { ImagePlus, Trash2, Edit } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetHeroSectionsQuery,
  useCreateHeroSectionMutation,
  useUpdateHeroSectionMutation,
  useDeleteHeroSectionMutation,
} from "@/services/heroApi";
import { useGetProductsQuery, type ProductItem } from "@/services/productsApi";
import { useGetServicesQuery, type ServiceItem } from "@/services/servicesApi";
import { MOCK_PRODUCTS_SEED } from "@/features/catalog/lib/mockProductsData";
import type { HeroType } from "@/types/hero";

export default function HeroSectionPage() {
  const { data: response, isLoading } = useGetHeroSectionsQuery();
  const [createHero, { isLoading: isCreating }] =
    useCreateHeroSectionMutation();
  const [updateHero, { isLoading: isUpdating }] =
    useUpdateHeroSectionMutation();
  const [deleteHero] = useDeleteHeroSectionMutation();

  const { data: productsData } = useGetProductsQuery();
  const { data: servicesData } = useGetServicesQuery();

  const heroSections = response?.data || [];

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [heroType, setHeroType] = useState<HeroType>("product");
  const [referenceId, setReferenceId] = useState(""); // product or service ID
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract products list
  const apiProducts: ProductItem[] = useMemo(() => {
    if (!productsData) return [];
    if (Array.isArray(productsData)) return productsData;
    if (Array.isArray(productsData.data)) return productsData.data;
    if (productsData.data && Array.isArray((productsData.data as any).products)) {
      return (productsData.data as any).products;
    }
    return [];
  }, [productsData]);

  const productList = useMemo(() => {
    const list: ProductItem[] =
      apiProducts.length > 0
        ? [...apiProducts]
        : MOCK_PRODUCTS_SEED.map((p) => ({
            _id: p.id,
            name: p.name,
          }));

    if (selectedHeroId) {
      const hero = heroSections.find((h) => h._id === selectedHeroId);
      if (
        hero?.type === "product" &&
        hero.product &&
        typeof hero.product === "object" &&
        hero.product._id
      ) {
        const exists = list.some(
          (item) => (item._id || item.id) === hero.product._id,
        );
        if (!exists) {
          list.unshift({
            _id: hero.product._id,
            name:
              hero.product.name ||
              hero.product.header ||
              hero.product.title ||
              `Product (${hero.product._id})`,
          });
        }
      }
    }

    return list;
  }, [apiProducts, selectedHeroId, heroSections]);

  // Extract services list
  const apiServices: ServiceItem[] = useMemo(() => {
    if (!servicesData) return [];
    if (Array.isArray(servicesData)) return servicesData;
    if (Array.isArray(servicesData.data)) return servicesData.data;
    if (servicesData.data && Array.isArray((servicesData.data as any).services)) {
      return (servicesData.data as any).services;
    }
    return [];
  }, [servicesData]);

  const mockServicesList: ServiceItem[] = useMemo(
    () => [
      { _id: "S-1001", name: "AC Repair & Maintenance" },
      { _id: "S-1002", name: "Full Stack Web Development" },
      { _id: "S-1003", name: "Home Deep Cleaning" },
      { _id: "S-1004", name: "Plumbing & Pipe Fixing" },
    ],
    [],
  );

  const serviceList = useMemo(() => {
    const list: ServiceItem[] =
      apiServices.length > 0 ? [...apiServices] : [...mockServicesList];

    if (selectedHeroId) {
      const hero = heroSections.find((h) => h._id === selectedHeroId);
      if (
        hero?.type === "service" &&
        hero.service &&
        typeof hero.service === "object" &&
        hero.service._id
      ) {
        const exists = list.some(
          (item) => (item._id || item.id) === hero.service._id,
        );
        if (!exists) {
          list.unshift({
            _id: hero.service._id,
            name:
              hero.service.name ||
              hero.service.title ||
              hero.service.serviceName ||
              `Service (${hero.service._id})`,
          });
        }
      }
    }

    return list;
  }, [apiServices, mockServicesList, selectedHeroId, heroSections]);

  const currentOptionExists = useMemo(() => {
    if (!referenceId) return true;
    if (heroType === "product") {
      return productList.some((p) => (p._id || p.id) === referenceId);
    } else {
      return serviceList.some((s) => (s._id || s.id) === referenceId);
    }
  }, [referenceId, heroType, productList, serviceList]);

  useEffect(() => {
    if (selectedHeroId) {
      const hero = heroSections.find((h) => h._id === selectedHeroId);
      if (hero) {
        setTitle(hero.header || "");
        setDescription(hero.description || "");
        setHeroType(hero.type || "product");
        setImagePreview(
          hero.image
            ? `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace("/api/v1", "")}${hero.image}`
            : null,
        );
        setSelectedFile(null);
        if (hero.type === "product" && hero.product) {
          setReferenceId(hero.product._id || hero.product);
        } else if (hero.type === "service" && hero.service) {
          setReferenceId(hero.service._id || hero.service);
        } else {
          setReferenceId("");
        }
        setIsFormVisible(true);
      }
    }
  }, [selectedHeroId, heroSections]);

  const handleCreateNew = () => {
    setSelectedHeroId(null);
    setTitle("");
    setDescription("");
    setHeroType("product");
    setReferenceId("");
    setImagePreview(null);
    setSelectedFile(null);
    setIsFormVisible(true);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!title || !description) {
      alert("Header and description are required");
      return;
    }

    const formData = new FormData();
    formData.append("header", title);
    formData.append("description", description);
    formData.append("type", heroType);

    if (heroType === "product" && referenceId) {
      formData.append("product", referenceId);
    } else if (heroType === "service" && referenceId) {
      formData.append("service", referenceId);
    }

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      if (selectedHeroId) {
        await updateHero({ id: selectedHeroId, formData }).unwrap();
      } else {
        if (!selectedFile) {
          alert("Image is required when creating a new hero section");
          return;
        }
        await createHero(formData).unwrap();
      }
      setIsFormVisible(false);
      setSelectedHeroId(null);
    } catch (error) {
      console.error("Failed to save hero section:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this hero section?")) {
      try {
        await deleteHero(id).unwrap();
        if (selectedHeroId === id) {
          setIsFormVisible(false);
          setSelectedHeroId(null);
        }
      } catch (error) {
        console.error("Failed to delete hero section:", error);
      }
    }
  };

  const buttonText = useMemo(() => {
    return heroType === "product" ? "Shop Now" : "Go To Service";
  }, [heroType]);

  return (
    <PageShell title="Hero Sections" description="Manage homepage hero slides.">
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Existing Hero Sections</CardTitle>
            <Button onClick={handleCreateNew}>Add New Hero</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : heroSections.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                No hero sections found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Header</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heroSections.map((hero) => (
                      <TableRow key={hero._id}>
                        <TableCell>
                          {hero.image ? (
                            <img
                              src={`${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace("/api/v1", "")}${hero.image}`}
                              alt={hero.header}
                              className="h-12 w-20 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-20 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {hero.header}
                        </TableCell>
                        <TableCell className="capitalize">
                          {hero.type}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedHeroId(hero._id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(hero._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {isFormVisible && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]" id="hero-form">
            <Card className="border-[#EEE7DF] shadow-soft">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>
                  {selectedHeroId ? "Edit Hero" : "Create Hero"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormVisible(false)}
                >
                  Cancel
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Header
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Discover Our Latest Collection"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border p-3"
                    placeholder="Enter hero description..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Hero Type
                  </label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={heroType === "product" ? "default" : "outline"}
                      onClick={() => {
                        setHeroType("product");
                        setReferenceId("");
                      }}
                    >
                      Product
                    </Button>
                    <Button
                      type="button"
                      variant={heroType === "service" ? "default" : "outline"}
                      onClick={() => {
                        setHeroType("service");
                        setReferenceId("");
                      }}
                    >
                      Service
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium capitalize">
                    Select {heroType}
                  </label>
                  <select
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select a {heroType} --</option>
                    {!currentOptionExists && referenceId && (
                      <option value={referenceId}>
                        Selected ID: {referenceId}
                      </option>
                    )}
                    {heroType === "product"
                      ? productList.map((prod) => {
                          const pId = prod._id || prod.id || "";
                          const pName =
                            prod.name ||
                            prod.title ||
                            prod.header ||
                            `Product (${pId})`;
                          return (
                            <option key={pId} value={pId}>
                              {pName}
                            </option>
                          );
                        })
                      : serviceList.map((serv) => {
                          const sId = serv._id || serv.id || "";
                          const sName =
                            serv.title ||
                            serv.name ||
                            serv.serviceName ||
                            `Service (${sId})`;
                          return (
                            <option key={sId} value={sId}>
                              {sName}
                            </option>
                          );
                        })}
                  </select>
                  {referenceId && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Selected ID:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {referenceId}
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Upload Image
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                    <ImagePlus />
                    {selectedFile
                      ? selectedFile.name
                      : imagePreview
                        ? "Change Image"
                        : "Select Image"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleUpload}
                      ref={fileInputRef}
                    />
                  </label>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : "Save Hero"}
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-125 overflow-hidden rounded-3xl">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full bg-[#F7F5F2] flex items-center justify-center text-muted-foreground">
                      No Image Selected
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute left-10 top-1/2 max-w-lg -translate-y-1/2 text-white">
                    <h1 className="text-5xl font-bold">
                      {title || "Your Header Here"}
                    </h1>
                    <p className="mt-4">
                      {description || "Your description will appear here."}
                    </p>
                    <Button className="mt-6 bg-white text-black">
                      {buttonText}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
