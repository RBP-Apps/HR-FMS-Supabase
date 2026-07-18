import React from "react";

const ConfirmationLetterPreview = ({ formData }) => {
  return (
    <div className="p-8 space-y-8 flex-1 bg-gray-100">
      <div id="confirmation-page" className="max-w-3xl mx-auto bg-white shadow-2xl p-8 space-y-4 min-h-[600px] border border-gray-200">
        {/* Company Header */}
        <div className="text-center border-b border-red-500 pb-4">
          <div className="flex justify-center mb-4">
            <img
              src="/Logo.PNG"
              alt="Logo"
              className="h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{formData.companyName}</h1>
        </div>

        {/* Date */}
        <div className="flex justify-end">
          <p>Date: {formData.confirmationDate}</p>
        </div>

        {/* Subject */}
        <div>
          <p className="font-bold">Subject: Confirmation of Employment</p>
        </div>

        {/* Salutation */}
        <div>
          <p>Dear {formData.employeeName},</p>
        </div>

        {/* Confirmation Content */}
        <div className="space-y-3">
          <p className="leading-relaxed">
            We are pleased to inform you that you have successfully completed your probation period, effective from{" "}
            <span className="font-bold">{formData.effectiveDate}</span>. Based on your performance, behavior, and
            contribution to the organization, we are happy to confirm your appointment as a{" "}
            <span className="font-bold">{formData.designation}</span> at {formData.companyName}
          </p>

          <p className="leading-relaxed">
            You are now a permanent employee of the organization and will be entitled to all benefits as per the
            company's policies applicable to confirmed employees, including:
          </p>

          <ul className="list-disc pl-8 space-y-1">
            <li>Provident Fund (PF) as per statutory norms</li>
            <li>Employee State Insurance (ESI) where applicable</li>
            <li>Gratuity as per Payment of Gratuity Act</li>
            <li>Medical Insurance coverage</li>
            <li>Performance-linked incentives as per company policy</li>
          </ul>

          <p className="leading-relaxed">
            We value your hard work and commitment. We trust that you will continue to perform your duties with the same
            level of dedication and professionalism, contributing to the growth and success of the organization.
          </p>

          <p className="leading-relaxed">Wishing you a successful career with us.</p>
        </div>

        {/* Signature */}
        <div className="pt-8">
          <p>Sincerely,</p>
          <p className="mt-6">For {formData.companyName}</p>
          <p className="mt-4">Authorized Signatory</p>
          <p>(Seal)</p>
        </div>


      </div>
    </div>
  );
};

export default ConfirmationLetterPreview;
