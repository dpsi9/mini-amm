import AMM from "@/components/AMM";

// export default function Home() {
//   return (
//     <div className="min-h-screen w-full bg-[#020617] relative">
//       {/* Purple Radial Glow Background */}
//       <div
//         className="absolute inset-0 z-0"
//         style={{
//           backgroundImage: `radial-gradient(circle 500px at 50% 100px, rgba(139,92,246,0.4), transparent)`,
//         }}
//       />
//       <AMM />
//     </div>
//   );
// }
// dsd


export default function Home() {
  return (
    <div className="min-h-screen w-full relative">
  <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #7c3aed 100%, transparent)",
    }}
  />
    <AMM />
</div>

  );
}
