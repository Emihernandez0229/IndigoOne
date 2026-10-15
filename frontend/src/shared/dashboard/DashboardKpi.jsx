import {
  TrendingDown,
  TrendingUp,
} from "lucide-react";


import {
  kpiIcons
} from "../constants/kpiIcons";

import { kpiColors } from "../constants/kpiColors";


export default function DashboardKpi({
  title,
  value,
  description,
  trend,
  trendDirection = "up",
  type,
  color,
  dense = false,
}) {

  const Icon = kpiIcons[type];
  const palette = kpiColors[color];


  const isPositive =
    trendDirection === "up";


  const TrendIcon =
    isPositive
      ? TrendingUp
      : TrendingDown;


  return (

    <article
      className={`
        rounded-2xl
        border
        border-gray-200
        bg-surface
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        ${dense ? "p-3" : "p-5"}
      `}
    >


      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >


        <div className="min-w-0">

          <p
            className={`
              font-medium
              text-text-secondary
              ${dense ? "text-xs" : "text-sm"}
            `}
          >
            {title}
          </p>


          <p
            className={`
              font-bold
              tracking-tight
              text-text-primary
              ${dense ? "mt-1 text-xl" : "mt-3 text-3xl"}
            `}
          >
            {value}
          </p>

        </div>


        {
          Icon && (

            <div
              className={`
                flex
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${dense ? "h-8 w-8" : "h-11 w-11"}
                ${palette ? palette.bg : "bg-indigo-light"}
              `}
            >

              <Icon
                className={`
                  ${dense ? "h-4 w-4" : "h-6 w-6"}
                  ${palette ? palette.text : "text-indigo-primary"}
                `}
              />

            </div>

          )
        }

      </div>



      {
        (trend || description) && (

          <div
            className={`
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
              ${dense ? "mt-2" : "mt-4"}
            `}
          >

            {
              trend && (

                <div
                  className={`
                    inline-flex
                    items-center
                    gap-1
                    font-medium
                    ${dense ? "text-xs" : "text-sm"}
                    ${
                      isPositive
                        ? "text-success"
                        : "text-error"
                    }
                  `}
                >

                  <TrendIcon className={dense ? "h-3 w-3" : "h-4 w-4"} />

                  <span>
                    {trend}
                  </span>

                </div>

              )
            }


            {
              description && (

                <span
                  className={`
                    text-text-secondary
                    ${dense ? "text-xs" : "text-sm"}
                  `}
                >
                  {description}
                </span>

              )
            }

          </div>

        )
      }


    </article>

  );

}