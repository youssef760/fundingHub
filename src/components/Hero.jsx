import { setGlobalState, useGlobalState } from '../store';

const StatBox = ({ data, label }) => (
  <div className="flex flex-col justify-center items-center h-20 border shadow-md w-full">
    <span className="text-lg font-bold text-green-400 leading-5">
      {data}
    </span>
    <span className="text-gray-300">{label}</span>
  </div>
);

const Hero = () => {
  const [stats] = useGlobalState('stats');

  return (
    <div className="text-center bg-gray-800 text-white py-36 px-6">
      <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight mb-12">
        <span className="capitalize">
          Inspire, Create, Fund – 
          <span className="uppercase text-green-400">
            FundingHub,
          </span> 
          Your Symphony of Crowdfunding Success.
        </span>
      </h1>
      <div className="flex justify-center items-center space-x-2">
        <button
          type="button"
          className="inline-block px-6 py-2.5 bg-green-400
          text-gray-800 font-medium text-xs leading-tight uppercase
          rounded-full shadow-md hover:bg-green-500"
          onClick={() => setGlobalState('startModal', 'scale-100')}
        >
          Add Project
        </button>

        <button
          type="button"
          className="inline-block px-6 py-2.5 border border-green-400
          font-medium text-xs leading-tight uppercase text-green-400
          rounded-full shadow-md bg-transparent hover:bg-green-500
          hover:text-white"
          onClick={() => setGlobalState('contributeModal', 'scale-100')}
        >
          Back Projects
        </button>
      </div>

      <div className="flex justify-center items-center mt-10">
        <StatBox data={stats?.totalProjects || 0} label="Projects" />
        <StatBox data={stats?.totalBacking || 0} label="Backings" />
        <StatBox data={stats?.totalDonations || 0} label="Donated ETH" />
      </div>
    </div>
  );
};

export default Hero;
