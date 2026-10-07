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
      className="
        rounded-2xl
        border
        border-gray-200
        bg-surface
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >


      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >


        <div className="min-w-0">

          <p
            className="
              text-sm
              font-medium
              text-text-secondary
            "
          >
            {title}
          </p>


          <p
            className="
              mt-3
              text-3xl
              font-bold
              tracking-tight
              text-text-primary
            "
          >
            {value}
          </p>

        </div>


        {
          Icon && (

            <div
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${palette ? palette.bg : "bg-indigo-light"}
              `}
            >

              <Icon
                className={`
                  h-6
                  w-6
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
            className="
              mt-4
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
            "
          >

            {
              trend && (

                <div
                  className={`
                    inline-flex
                    items-center
                    gap-1
                    text-sm
                    font-medium

                    ${
                      isPositive
                        ? "text-success"
                        : "text-error"
                    }
                  `}
                >

                  <TrendIcon className="h-4 w-4" />

                  <span>
                    {trend}
                  </span>

                </div>

              )
            }


            {
              description && (

                <span
                  className="
                    text-sm
                    text-text-secondary
                  "
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