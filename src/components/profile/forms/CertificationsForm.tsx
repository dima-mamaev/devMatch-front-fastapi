"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Certification } from "@/lib/api/types";

export interface AddCertificationData {
  name: string;
  description: string | null;
}

export interface UpdateCertificationData extends AddCertificationData {
  id: string;
}

interface CertificationsFormProps {
  certifications: Array<
    Pick<Certification, "id" | "name" | "description">
  >;
  onAdd: (data: AddCertificationData) => Promise<void>;
  onUpdate: (data: UpdateCertificationData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

interface CertFormFields {
  name: string;
  description: string;
}

function CertEditor({
  initial,
  onSave,
  onCancel,
  isLoading,
}: {
  initial?: Pick<Certification, "name" | "description">;
  onSave: (data: { name: string; description: string | null }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertFormFields>({
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    },
  });

  const submit = handleSubmit(async (data) => {
    await onSave({
      name: data.name.trim(),
      description: data.description.trim() || null,
    });
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <Input
        label="Name"
        placeholder="Certification or course title"
        error={errors.name?.message}
        {...register("name", {
          required: "Required",
          maxLength: { value: 500, message: "Max 500 characters" },
        })}
      />
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Issuer or short blurb (optional)"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          {...register("description", {
            maxLength: { value: 2000, message: "Max 2000 characters" },
          })}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading}
        >
          <CheckIcon className="w-4 h-4" />
          Save
        </Button>
        <Button
          type="button"
          variant="ghost-muted"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          <XIcon className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CertCard({
  cert,
  onEdit,
  onDelete,
}: {
  cert: Pick<Certification, "id" | "name" | "description">;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-indigo-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{cert.name}</p>
        {cert.description && (
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            {cert.description}
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function CertificationsForm({
  certifications,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}: CertificationsFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (data: { name: string; description: string | null }) => {
    await onAdd(data);
    setIsAdding(false);
  };

  const handleUpdate = (id: string) =>
    async (data: { name: string; description: string | null }) => {
      await onUpdate({ id, ...data });
      setEditingId(null);
    };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Certifications</h2>
        </div>
        {!isAdding && (
          <Button
            type="button"
            variant="ghost-muted"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isAdding && (
          <CertEditor
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
            isLoading={isLoading}
          />
        )}
        {certifications.length === 0 && !isAdding && (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No certifications yet.
          </p>
        )}
        {certifications.map((cert) =>
          editingId === cert.id ? (
            <CertEditor
              key={cert.id}
              initial={cert}
              onSave={handleUpdate(cert.id)}
              onCancel={() => setEditingId(null)}
              isLoading={isLoading}
            />
          ) : (
            <CertCard
              key={cert.id}
              cert={cert}
              onEdit={() => {
                setEditingId(cert.id);
                setIsAdding(false);
              }}
              onDelete={() => onDelete(cert.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}
