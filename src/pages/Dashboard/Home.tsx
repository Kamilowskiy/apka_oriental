import MonthlyTarget from "./components/YearlyTarget";
import RecentOrders from "./components/RecentOrders";
// import DemographicCard from "./components/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import SaasMetrics from "./components/SaasMetrics";
import CrmStatisticsChart from "./components/CrmStatisticsChart";
import UpcomingSchedule from "./components/UpcomingSchedule";
import ActivitiesCard from "./components/ActivitiesCard";
import DataTableThree from "./components/Table/DataTableThree";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Oriental Design Client service panel"
        description="Oriental Design Client service panel"
      />
      <div className="space-y-5 sm:space-y-6">
        <SaasMetrics />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <CrmStatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12 xl:col-span-7">
          {/* <DemographicCard /> */}
          <UpcomingSchedule />
          
        </div>
        <div className="col-span-12 xl:col-span-5">
          {/* <DemographicCard /> */}
          <ActivitiesCard />
          
        </div>

        <div className="col-span-12">
          <DataTableThree />
        </div>


      </div>
      </div>
    </>
  );
}
