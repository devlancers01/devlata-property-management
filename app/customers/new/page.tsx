"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerFormSchema, type CustomerFormData, type GroupMemberFormData } from "@/lib/validations/customer";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Upload, AlertCircle, Plus, Trash2, X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

import type { GroupMember, GroupMemberForm } from "@/models/customer.model";
import { PaymentMode, PaymentType, Payment } from "@/models/customer.model";

export default function NewCustomerPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [idProofFile, setIdProofFile] = useState<File | null>(null);
    const [idProofPreview, setIdProofPreview] = useState<string>("");
    const [advanceReceiptFile, setAdvanceReceiptFile] = useState<File | null>(null);
    const [advanceReceiptPreview, setAdvanceReceiptPreview] = useState<string>("");
    const [conflictWarning, setConflictWarning] = useState<string>("");
    const [groupMembers, setGroupMembers] = useState<GroupMemberForm[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        trigger,
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: {
            checkInTime: "12:00",
            checkOutTime: "10:00",
            cuisineCharges: 0,
            receivedAmount: 0,
            idType: "Aadhar",
            gender: "male",
            advancePaymentMode: "cash",
        },
    });

    const watchCheckIn = watch("checkIn");
    const watchCheckOut = watch("checkOut");
    const watchStayCharges = watch("stayCharges");
    const watchCuisineCharges = watch("cuisineCharges");
    const watchReceivedAmount = watch("receivedAmount");
    const watchIdValue = watch("idValue");

    // Calculate totals
    const totalAmount = (watchStayCharges || 0) + (watchCuisineCharges || 0);
    const balanceAmount = totalAmount - (watchReceivedAmount || 0);

    const isValidDate = (value: unknown): value is Date => {
        return value instanceof Date && !isNaN(value.getTime());
    };

    // Check for booking conflicts
    const checkConflicts = async () => {
        if (!isValidDate(watchCheckIn) || !isValidDate(watchCheckOut)) {
            setConflictWarning("");
            return;
        }

        try {
            const res = await fetch("/api/customers/conflicts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    checkIn: watchCheckIn.toISOString(),
                    checkOut: watchCheckOut.toISOString(),
                }),
            });

            const data = await res.json();

            if (data.hasConflict) {
                setConflictWarning(
                    `⚠️ Booking conflict! ${data.conflictingBookings.length} existing booking(s) overlap with these dates.`
                );
            } else {
                setConflictWarning("");
            }
        } catch (error) {
            console.error("Error checking conflicts:", error);
        }
    };

    // Handle file upload with proper Firebase auth token
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "idProof" | "receipt") => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            toast.error("Only JPG, PNG, or PDF files are allowed");
            return;
        }

        if (type === "idProof") {
            setIdProofFile(file);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => setIdProofPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setIdProofPreview("");
            }
        } else {
            setAdvanceReceiptFile(file);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => setAdvanceReceiptPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setAdvanceReceiptPreview("");
            }
        }
    };

    const uploadFile = async (file: File, folder: string): Promise<string> => {
        try {
            // Check if user is authenticated
            const auth = getAuth();
            if (!auth.currentUser) {
                throw new Error("User not authenticated. Please sign in again.");
            }

            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `${folder}/${fileName}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error: any) {
            console.error("Upload error:", error);
            if (error.code === "storage/unauthorized") {
                toast.error("Upload failed: Please sign in again");
                throw new Error("Authentication required. Please refresh and sign in again.");
            }
            throw error;
        }
    };

    // Group Members Management
    const addGroupMember = () => {
        setGroupMembers([
            ...groupMembers,
            {
                uid: Date.now().toString(),
                name: "",
                age: 0,
                gender: "male",
                idType: "Aadhar",
                idValue: "",
            } as GroupMemberForm,
        ]);
    };

    const updateGroupMember = (id: string, field: keyof GroupMemberForm, value: any) => {
        setGroupMembers(
            groupMembers.map((member) =>
                member.uid === id ? { ...member, [field]: value } : member
            )
        );
    };

    const handleMemberFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            toast.error("Only JPG, PNG, or PDF files are allowed");
            return;
        }

        const member = groupMembers.find((m) => m.uid === id);
        if (!member) return;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateGroupMember(id, "idProofFile", file);
                updateGroupMember(id, "idProofPreview", reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            updateGroupMember(id, "idProofFile", file);
            updateGroupMember(id, "idProofPreview", "");
        }
    };

    const removeGroupMember = (id: string) => {
        setGroupMembers(groupMembers.filter((member) => member.uid !== id));
    };

    const onSubmit = async (data: CustomerFormData) => {
        setLoading(true);

        try {
            // Upload ID proof if present
            let idProofUrl = "";
            if (idProofFile) {
                setUploadingFile(true);
                idProofUrl = await uploadFile(idProofFile, "id-proofs");
                setUploadingFile(false);
            }

            // Upload advance receipt if present
            let advanceReceiptUrl = "";
            if (advanceReceiptFile) {
                setUploadingFile(true);
                advanceReceiptUrl = await uploadFile(advanceReceiptFile, "receipts");
                setUploadingFile(false);
            }

            // Build clean customer payload
            const customerPayload: any = {
                name: data.name,
                age: data.age,
                gender: data.gender,
                phone: data.phone,
                email: data.email,
                address: data.address,
                idType: data.idType,
                vehicleNumber: data.vehicleNumber,
                checkIn: data.checkIn.toISOString(),
                checkOut: data.checkOut.toISOString(),
                checkInTime: data.checkInTime,
                checkOutTime: data.checkOutTime,
                stayCharges: data.stayCharges,
                cuisineCharges: data.cuisineCharges || 0,
                receivedAmount: data.receivedAmount || 0,
                advancePaymentMode: data.advancePaymentMode || "cash",
                advanceReceiptUrl: advanceReceiptUrl || "",
                members: groupMembers,
            };

            // Add optional fields only if they exist
            if (data.idValue) customerPayload.idValue = data.idValue;
            if (idProofUrl) customerPayload.idProofUrl = idProofUrl;
            if (data.instructions) customerPayload.instructions = data.instructions;

            // Submit customer data
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customerPayload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create customer");
            }

            const result = await res.json();
            const customerId = result.customer.uid;

            // Upload group member ID proofs and prepare clean data
            const membersToAdd = await Promise.all(
                groupMembers.map(async (member) => {
                    const cleanMember: any = {
                        name: member.name,
                        age: member.age,
                        gender: member.gender,
                        idType: member.idType,
                    };

                    // Add optional fields only if they exist
                    if (member.idValue) cleanMember.idValue = member.idValue;

                    // Upload ID proof if present
                    if (member.idProofFile) {
                        const url = await uploadFile(member.idProofFile, "id-proofs");
                        cleanMember.idProofUrl = url;
                    }

                    return cleanMember;
                })
            );

            // Add group members to subcollection
            if (membersToAdd.length > 0) {
                await Promise.all(
                    membersToAdd.map((member) =>
                        fetch(`/api/customers/${customerId}/members`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(member),
                        })
                    )
                );
            }

            toast.success("Customer created successfully!");
            router.push(`/customers/${customerId}`);
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error(error.message || "Failed to create customer");
        } finally {
            setLoading(false);
            setUploadingFile(false);
        }
    };

    const nextStep = async () => {
        const fieldsToValidate = getFieldsForStep(currentStep);
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            // Special validation for step 1 (Booking dates)
            if (currentStep === 1) {
                if (conflictWarning) {
                    toast.error("Please resolve booking conflicts before proceeding");
                    return;
                }
            }

            // Special validation for step 3 (ID Proof)
            if (currentStep === 3) {
                if (!watchIdValue && !idProofFile) {
                    toast.error("Either ID number or ID proof image is required");
                    return;
                }
            }

            setCurrentStep((prev) => Math.min(prev + 1, 6) as Step);
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
    };

    const getFieldsForStep = (step: Step): (keyof CustomerFormData)[] => {
        switch (step) {
            case 1: // Booking Details
                return ["checkIn", "checkOut", "vehicleNumber"];
            case 2: // Personal Details
                return ["name", "age", "phone", "email", "address"];
            case 3: // ID Proof
                return ["idType"];
            case 4: // Group members are optional
                return [];
            case 5: // Financial Details
                return ["stayCharges"];
            case 6: // Review step
                return [];
            default:
                return [];
        }
    };

    return (
        <AppShell>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate">
                                New Booking
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Step {currentStep} of 6</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex gap-1 sm:gap-2">
                            {[1, 2, 3, 4, 5, 6].map((step) => (
                                <div
                                    key={step}
                                    className={`h-2 flex-1 rounded-full transition-colors ${step <= currentStep ? "bg-primary" : "bg-slate-200"
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="mt-3 sm:mt-4 grid grid-cols-6 gap-1 text-xs sm:text-sm">
                            <span className={currentStep >= 1 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                Booking
                            </span>
                            <span className={currentStep >= 2 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                Personal
                            </span>
                            <span className={currentStep >= 3 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                ID
                            </span>
                            <span className={currentStep >= 4 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                Members
                            </span>
                            <span className={currentStep >= 5 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                Financial
                            </span>
                            <span className={currentStep >= 6 ? "text-primary font-medium text-center" : "text-slate-400 text-center"}>
                                Review
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card className="shadow-lg">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg sm:text-xl">
                                    {currentStep === 1 && "Booking Details"}
                                    {currentStep === 2 && "Personal Details"}
                                    {currentStep === 3 && "ID Proof"}
                                    {currentStep === 4 && "Group Members (Optional)"}
                                    {currentStep === 5 && "Financial Details"}
                                    {currentStep === 6 && "Review & Confirm"}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6">
                                {/* Step 1: Booking Details (MOVED TO FIRST) */}
                                {currentStep === 1 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {conflictWarning && (
                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-yellow-800">{conflictWarning}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="checkIn">Check-In Date *</Label>
                                                <Input
                                                    id="checkIn"
                                                    type="date"
                                                    {...register("checkIn", { valueAsDate: true })}
                                                    className={errors.checkIn ? "border-red-500" : ""}
                                                    onBlur={checkConflicts}
                                                />
                                                {errors.checkIn && (
                                                    <p className="text-xs text-red-600">{errors.checkIn.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="checkInTime">Check-In Time</Label>
                                                <Input
                                                    id="checkInTime"
                                                    type="time"
                                                    {...register("checkInTime")}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="checkOut">Check-Out Date *</Label>
                                                <Input
                                                    id="checkOut"
                                                    type="date"
                                                    {...register("checkOut", { valueAsDate: true })}
                                                    className={errors.checkOut ? "border-red-500" : ""}
                                                    onBlur={checkConflicts}
                                                />
                                                {errors.checkOut && (
                                                    <p className="text-xs text-red-600">{errors.checkOut.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="checkOutTime">Check-Out Time</Label>
                                                <Input
                                                    id="checkOutTime"
                                                    type="time"
                                                    {...register("checkOutTime")}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                                            <Input
                                                id="vehicleNumber"
                                                {...register("vehicleNumber")}
                                                placeholder="MH01AB1234"
                                                className={errors.vehicleNumber ? "border-red-500" : ""}
                                            />
                                            {errors.vehicleNumber && (
                                                <p className="text-xs text-red-600">{errors.vehicleNumber.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                                            <Textarea
                                                id="instructions"
                                                {...register("instructions")}
                                                placeholder="Any special requests or notes..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Personal Details (MOVED TO SECOND) */}
                                {currentStep === 2 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name *</Label>
                                                <Input
                                                    id="name"
                                                    {...register("name")}
                                                    placeholder="John Doe"
                                                    className={errors.name ? "border-red-500" : ""}
                                                />
                                                {errors.name && (
                                                    <p className="text-xs text-red-600">{errors.name.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age *</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    {...register("age", { valueAsNumber: true })}
                                                    placeholder="30"
                                                    className={errors.age ? "border-red-500" : ""}
                                                />
                                                {errors.age && (
                                                    <p className="text-xs text-red-600">{errors.age.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender *</Label>
                                                <Select
                                                    value={watch("gender")}
                                                    onValueChange={(value) => setValue("gender", value as any)}
                                                >
                                                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.gender && (
                                                    <p className="text-xs text-red-600">{errors.gender.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number *</Label>
                                                <Input
                                                    id="phone"
                                                    {...register("phone")}
                                                    placeholder="+91 98765 43210"
                                                    className={errors.phone ? "border-red-500" : ""}
                                                />
                                                {errors.phone && (
                                                    <p className="text-xs text-red-600">{errors.phone.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    {...register("email")}
                                                    placeholder="john@example.com"
                                                    className={errors.email ? "border-red-500" : ""}
                                                />
                                                {errors.email && (
                                                    <p className="text-xs text-red-600">{errors.email.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address *</Label>
                                            <Textarea
                                                id="address"
                                                {...register("address")}
                                                placeholder="123 Main Street, Mumbai, Maharashtra"
                                                rows={3}
                                                className={errors.address ? "border-red-500" : ""}
                                            />
                                            {errors.address && (
                                                <p className="text-xs text-red-600">{errors.address.message}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: ID Proof */}
                                {currentStep === 3 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> You can either enter the ID number OR upload an ID proof image. At least one is required.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="idType">ID Proof Type *</Label>
                                            <Select
                                                onValueChange={(value) => setValue("idType", value as any)}
                                                defaultValue="Aadhar"
                                            >
                                                <SelectTrigger className={errors.idType ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Select ID type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                                                    <SelectItem value="PAN">PAN Card</SelectItem>
                                                    <SelectItem value="Driving License">Driving License</SelectItem>
                                                    <SelectItem value="Passport">Passport</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.idType && (
                                                <p className="text-xs text-red-600">{errors.idType.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="idValue">ID Number (Optional if uploading image)</Label>
                                            <Input
                                                id="idValue"
                                                {...register("idValue")}
                                                placeholder="1234 5678 9012"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="idProof">Upload ID Proof (Optional if entering number)</Label>
                                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary transition-colors">
                                                <input
                                                    type="file"
                                                    id="idProof"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleFileChange(e, "idProof")}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="idProof"
                                                    className="cursor-pointer flex flex-col items-center gap-2"
                                                >
                                                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                                                    <span className="text-sm text-slate-600">
                                                        Click to upload or drag and drop
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        JPG, PNG or PDF (max 5MB)
                                                    </span>
                                                </label>
                                            </div>

                                            {idProofPreview && (
                                                <div className="mt-4">
                                                    <img
                                                        src={idProofPreview}
                                                        alt="ID Proof Preview"
                                                        className="max-w-full h-auto rounded-lg border"
                                                    />
                                                </div>
                                            )}

                                            {idProofFile && !idProofPreview && (
                                                <div className="mt-4 p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-5 h-5 text-green-600" />
                                                        <span className="text-sm text-slate-700">{idProofFile.name}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setIdProofFile(null);
                                                            setIdProofPreview("");
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Group Members */}
                                {currentStep === 4 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-600">
                                                Add family members or companions (optional)
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addGroupMember}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Member
                                            </Button>
                                        </div>

                                        {groupMembers.length === 0 ? (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                                <p className="text-sm text-slate-500">
                                                    No group members added yet. Click "Add Member" to add companions.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {groupMembers.map((member, index) => (
                                                    <Card key={member.uid} className="border-2">
                                                        <CardContent className="p-4 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-semibold">Member {index + 1}</h4>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeGroupMember(member.uid)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </Button>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Name *</Label>
                                                                    <Input
                                                                        value={member.name}
                                                                        onChange={(e) =>
                                                                            updateGroupMember(member.uid, "name", e.target.value)
                                                                        }
                                                                        placeholder="Member name"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Age *</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={member.age || ""}
                                                                        onChange={(e) =>
                                                                            updateGroupMember(member.uid, "age", parseInt(e.target.value) || 0)
                                                                        }
                                                                        placeholder="Age"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Gender *</Label>
                                                                    <Select
                                                                        value={member.gender}
                                                                        onValueChange={(value) =>
                                                                            updateGroupMember(member.uid, "gender", value)
                                                                        }
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="male">Male</SelectItem>
                                                                            <SelectItem value="female">Female</SelectItem>
                                                                            <SelectItem value="other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>ID Type *</Label>
                                                                <Select
                                                                    value={member.idType}
                                                                    onValueChange={(value) =>
                                                                        updateGroupMember(member.uid, "idType", value)
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                                                                        <SelectItem value="PAN">PAN Card</SelectItem>
                                                                        <SelectItem value="Driving License">Driving License</SelectItem>
                                                                        <SelectItem value="Passport">Passport</SelectItem>
                                                                        <SelectItem value="Other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>ID Number (Optional if uploading image)</Label>
                                                                <Input
                                                                    value={member.idValue || ""}
                                                                    onChange={(e) =>
                                                                        updateGroupMember(member.uid, "idValue", e.target.value)
                                                                    }
                                                                    placeholder="1234 5678 9012"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>Upload ID Proof (Optional)</Label>
                                                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                                                                    <input
                                                                        type="file"
                                                                        id={`member-id-${member.uid}`}
                                                                        accept="image/*,.pdf"
                                                                        onChange={(e) => handleMemberFileChange(member.uid, e)}
                                                                        className="hidden"
                                                                    />
                                                                    <label
                                                                        htmlFor={`member-id-${member.uid}`}
                                                                        className="cursor-pointer flex flex-col items-center gap-2"
                                                                    >
                                                                        <Upload className="w-6 h-6 text-slate-400" />
                                                                        <span className="text-xs text-slate-600">
                                                                            Upload ID Proof
                                                                        </span>
                                                                    </label>
                                                                </div>

                                                                {member.idProofPreview && (
                                                                    <div className="mt-2">
                                                                        <img
                                                                            src={member.idProofPreview}
                                                                            alt="ID Preview"
                                                                            className="max-w-full h-32 object-contain rounded border"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {member.idProofFile && !member.idProofPreview && (
                                                                    <div className="mt-2 p-2 bg-slate-100 rounded flex items-center gap-2">
                                                                        <Check className="w-4 h-4 text-green-600" />
                                                                        <span className="text-xs text-slate-700">
                                                                            {member.idProofFile.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 5: Financial Details */}
                                {currentStep === 5 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="stayCharges">Stay Charges (₹) *</Label>
                                                <Input
                                                    id="stayCharges"
                                                    type="number"
                                                    {...register("stayCharges", { valueAsNumber: true })}
                                                    placeholder="5000"
                                                    className={errors.stayCharges ? "border-red-500" : ""}
                                                />
                                                {errors.stayCharges && (
                                                    <p className="text-xs text-red-600">{errors.stayCharges.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="receivedAmount">Advance Payment (₹)</Label>
                                                <Input
                                                    id="receivedAmount"
                                                    type="number"
                                                    {...register("receivedAmount", { valueAsNumber: true })}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="advancePaymentMode">Payment Mode</Label>
                                                <Select
                                                    onValueChange={(value) => setValue("advancePaymentMode", value as any)}
                                                    defaultValue="cash"
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select payment mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Cash</SelectItem>
                                                        <SelectItem value="UPI">UPI</SelectItem>
                                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {watchReceivedAmount > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="advanceReceipt">Upload Payment Receipt (Optional)</Label>
                                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary transition-colors">
                                                    <input
                                                        type="file"
                                                        id="advanceReceipt"
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => handleFileChange(e, "receipt")}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor="advanceReceipt"
                                                        className="cursor-pointer flex flex-col items-center gap-2"
                                                    >
                                                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                                                        <span className="text-sm text-slate-600">
                                                            Upload payment receipt
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            JPG, PNG or PDF (max 5MB)
                                                        </span>
                                                    </label>
                                                </div>

                                                {advanceReceiptPreview && (
                                                    <div className="mt-4">
                                                        <img
                                                            src={advanceReceiptPreview}
                                                            alt="Receipt Preview"
                                                            className="max-w-full h-auto rounded-lg border"
                                                        />
                                                    </div>
                                                )}

                                                {advanceReceiptFile && !advanceReceiptPreview && (
                                                    <div className="mt-4 p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-5 h-5 text-green-600" />
                                                            <span className="text-sm text-slate-700">
                                                                {advanceReceiptFile.name}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAdvanceReceiptFile(null);
                                                                setAdvanceReceiptPreview("");
                                                            }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Summary */}
                                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Stay Charges:</span>
                                                <span className="font-medium">₹{watchStayCharges || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                                <span className="text-slate-900 font-semibold">Total Amount:</span>
                                                <span className="font-bold text-lg">₹{totalAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Advance Received:</span>
                                                <span className="font-medium text-green-600">
                                                    ₹{watchReceivedAmount || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                                <span className="text-slate-900 font-semibold">Balance Amount:</span>
                                                <span
                                                    className={`font-bold text-lg ${balanceAmount > 0 ? "text-red-600" : "text-green-600"
                                                        }`}
                                                >
                                                    ₹{balanceAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 6: Review (NO AUTO-SUBMIT) */}
                                {currentStep === 6 && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                Please review all details before confirming the booking.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-2">
                                                    Booking Details
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-600">Check-In:</span>{" "}
                                                        {watch("checkIn")?.toLocaleDateString()} at {watch("checkInTime")}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Check-Out:</span>{" "}
                                                        {watch("checkOut")?.toLocaleDateString()} at{" "}
                                                        {watch("checkOutTime")}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Vehicle:</span>{" "}
                                                        {watch("vehicleNumber")}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-2">
                                                    Personal Details
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-600">Name:</span> {watch("name")}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Age:</span> {watch("age")}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Phone:</span> {watch("phone")}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Email:</span> {watch("email")}
                                                    </div>
                                                </div>
                                            </div>

                                            {groupMembers.length > 0 && (
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-2">
                                                        Group Members ({groupMembers.length})
                                                    </h3>
                                                    <div className="space-y-2 text-sm">
                                                        {groupMembers.map((member, index) => (
                                                            <div key={member.uid} className="p-2 bg-slate-50 rounded">
                                                                {index + 1}. {member.name}, Age {member.age}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-2">
                                                    Financial Summary
                                                </h3>
                                                <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Total Amount:</span>
                                                        <span className="font-bold">₹{totalAmount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Advance Payment:</span>
                                                        <span className="font-medium text-green-600">
                                                            ₹{watchReceivedAmount || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Balance Amount:</span>
                                                        <span
                                                            className={`font-bold ${balanceAmount > 0 ? "text-red-600" : "text-green-600"
                                                                }`}
                                                        >
                                                            ₹{balanceAmount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Navigation Buttons */}
                            <div className="border-t p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={loading}
                                        className="w-full sm:w-auto order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Button>
                                )}

                                {currentStep < 6 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="w-full sm:w-auto sm:ml-auto order-1 sm:order-2"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={loading || uploadingFile}
                                        className="w-full sm:w-auto sm:ml-auto order-1 sm:order-2"
                                    >
                                        {loading || uploadingFile ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                {uploadingFile ? "Uploading..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Confirm Booking
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}