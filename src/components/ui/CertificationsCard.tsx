interface Certification {
  id: string;
  name: string;
  description?: string | null;
}

interface CertificationsCardProps {
  certifications: Certification[];
}

export function CertificationsCard({ certifications }: CertificationsCardProps) {
  if (certifications.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <h2 className="text-base font-bold text-slate-900 mb-5">Certifications</h2>
      <div className="space-y-4">
        {certifications.map((cert) => (
          <div key={cert.id} className="flex gap-4">
            <div className="w-2.5 h-2.5 rounded-full mt-1 bg-indigo-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{cert.name}</p>
              {cert.description && (
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  {cert.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
