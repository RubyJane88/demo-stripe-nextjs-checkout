import { GetServerSideProps } from "next";
import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";
import { createCheckoutSession } from "next-stripe/client";

//product is of Stripe.Product
interface IPrice extends Stripe.Price {
  product: Stripe.Product;
}

interface IProps {
  prices: IPrice[];
}

export default function Home({ prices }: IProps) {
  const onClick = async (priceId: string) => {
    const session = await createCheckoutSession({
      success_url: window.location.href,
      cancel_url: window.location.href,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ["card"],
      mode: "payment",
    });
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId: session.id });
    }
  };

  return (
    <div>
      <h1>Code Mentors Wanted</h1>
      {/*<pre>{JSON.stringify(prices, null, 2)} </pre>*/}

      <ul>
        {prices.map((price) => (
          <li key={price.id}>
            {/*the type comes from Stripe.Product */}
            <h2> {price.product.name}</h2>
            <img src={price.product.images[0]} />
            {/*the unit_amount can be either number or null */}
            <p>Cost: NOK{((price.unit_amount as number) / 100).toFixed(2)} </p>
            <button onClick={() => onClick(price.id)}> Order</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* we use Stripe Secret Key because we're running server side.
 * Api version is the current version as of Feb 2021*/
export const getServerSideProps: GetServerSideProps = async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2020-08-27",
  });

  const prices = await stripe.prices.list({
    active: true,
    limit: 5,
    expand: ["data.product"],
  });

  return { props: { prices: prices.data } };
};
