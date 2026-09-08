import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Cpu, ArrowLeft, Terminal, AlertTriangle, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-polar-950 text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-polar-800 pb-4">
          <Link
            to="/digital-twin"
            className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Command Center</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">Document Ref: NCPOR-DT-TERMS-2026</span>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>OPERATIONAL DIRECTIVES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            Terms of Operational Use and Mission Control System Access
          </h1>
          <p className="text-sm text-slate-400 font-sans leading-relaxed">
            Antarctic Indian Polar Digital Twin (AIP-DT). National Centre for Polar and Ocean Research (NCPOR).
            Effective Date: September 2026.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="p-6 rounded-lg bg-polar-900/60 border border-polar-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold text-base">
              <Terminal className="w-4 h-4" />
              <span>1. Authorized Mission Control Operations</span>
            </div>
            <p>
              Access to this digital twin system is granted strictly for official monitoring, engineering analysis, predictive load balancing, and research lifecycle management of Indian Antarctic stations Maitri and Bharati.
            </p>
            <p>
              Users must not execute unauthorized simulation injections, inject synthetic fault commands into live telemetry pipelines, or attempt to bypass role-based security boundaries.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 rounded-lg bg-polar-900/60 border border-polar-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold text-base">
              <Cpu className="w-4 h-4" />
              <span>2. Telemetry Synchronization and Satellite Latency</span>
            </div>
            <p>
              Polar telemetry feeds reflect continuous physical sensor sampling intervals. Due to severe polar atmospheric conditions, geomagnetic storms, and satellite orbital geometry, intermittent transmission latency of 300ms to 2.5s may occur.
            </p>
            <p>
              In the event of temporary satellite link occlusions, station edge processors continue localized telemetry buffering and autonomous life support microgrid management until backhaul restoration.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 rounded-lg bg-polar-900/60 border border-polar-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold text-base">
              <AlertTriangle className="w-4 h-4" />
              <span>3. Advisory Nature of AI Intelligence Engines</span>
            </div>
            <p>
              The machine learning subsystems (IsolationForest anomaly detector, exponential smoothing forecasters, and operational risk assessment engines) provide deterministic advisory decision support.
            </p>
            <p>
              All automated recommendations, load-shedding advisories, and generator start suggestions must be validated by the qualified station commander or lead electrical engineer prior to initiating physical high-voltage switching.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 rounded-lg bg-polar-900/60 border border-polar-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold text-base">
              <ShieldAlert className="w-4 h-4" />
              <span>4. Life Support and Critical System Primacy</span>
            </div>
            <p>
              Life-support systems, including habitat interior heating, oxygen circulation, Lake Priyadarshini water pumping, and reverse osmosis desalination, possess absolute operational priority over scientific experiments and secondary payloads.
            </p>
            <p>
              What-if scenario simulations executed within this platform calculate theoretical risk parameters under simulated stress conditions and do not disrupt running life-support equipment.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 rounded-lg bg-polar-900/60 border border-polar-800 space-y-3">
            <h2 className="text-white font-mono font-semibold text-base">
              5. Intellectual Property and National Polar Data Rights
            </h2>
            <p>
              All software models, digital twin schemas, telemetry datasets, and predictive algorithms remain the exclusive intellectual property of the National Centre for Polar and Ocean Research, Ministry of Earth Sciences, Government of India.
            </p>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-4 border-t border-polar-800 text-center">
          <Link
            to="/digital-twin"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-polar-900 hover:bg-polar-800 border border-polar-700 text-cyan-400 text-xs font-mono font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Command Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
