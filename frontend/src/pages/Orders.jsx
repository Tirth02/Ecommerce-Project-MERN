import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Orders = () => {
  const { products, currency } = useContext(ShopContext);
  return (
    <div className="border-t pt-16">
      <div className="text-2xl ">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>
      <div>
        {products.slice(1, 4).map((item, index) => (
          <div
            key={index}
            className="py-4 border-t border-b text-gray-700
               flex flex-col md:flex-row md:items-center
               gap-4"
          >
            {/* Product Information */}
            <div className="flex items-start gap-6 text-sm flex-1">
              <img className="w-16 sm:w-20" src={item.image[0]} alt="" />

              <div className="flex-1">
                <p className="sm:text-base font-medium max-w-xs">{item.name}</p>

                {/* Price / Quantity / Size */}
                <div className="grid grid-cols-[70px_100px_70px] gap-3 mt-2 text-base">
                  <p className="text-lg">
                    {currency}
                    {item.price}
                  </p>

                  <p>Quantity: 1</p>

                  <p>Size: M</p>
                </div>

                <p className="mt-2">
                  Date: <span className="text-gray-400">25, Jul, 2026</span>
                </p>
              </div>
            </div>

            {/* Status + Track Order */}
            <div className="md:w-1/3 grid grid-cols-2 items-center">
              {/* Status */}
              <div className="flex items-center gap-2">
                <p className="min-w-2 h-2 rounded-full bg-green-500"></p>
                <p className="text-sm md:text-base">Ready to ship</p>
              </div>

              {/* Track Order */}
              <button className="border px-4 py-2 text-sm font-medium rounded-sm cursor-pointer ">Track Order</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
