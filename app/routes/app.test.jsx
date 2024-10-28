import { data, Form, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import React from 'react'
import { authenticate } from '../shopify.server';
// import { Form } from '@shopify/polaris';




export async function loader({request}) {
//     const { admin } = await authenticate.admin(request);

// const response = await admin.graphql(
//   `#graphql
//   query {
//     node(id: "gid://shopify/Product/8153278480545") {
//       id
//       ... on Product {
//         title
//       }
//     }
//   }`,
// );



// const data = await response.json();

const { admin } = await authenticate.admin(request);

const response = await admin.graphql(
  `#graphql
  mutation {
    productUpdate(input: {id: "gid://shopify/Product/8153278480545", title: "Puma Shoes"}) {
      product {
        id
      }
    }
  }`,
);

const data = await response.json();


    return json(data);

  }

const Test = () => {
    const product = useLoaderData();

    console.log(product);
    
  return (
    <Form method="post" >
      <h1>Settings for products</h1>

      <input
        name="name"
        defaultValue={product.name}
      />
      <input name="price" defaultValue={product.price} />

      <button type="submit">Save</button>
    </Form>
  )
}

// export async function action({request}) {
//     const formData = await request.formData();
// //     const product = await getProduct(request);

// //   await updateUser(product.id, {
// //     name: formData.get("name"),
// //     price: formData.get("price"),
// //   });

//   return json({
//     name: formData.get("name"),
//     price: formData.get("price"),
//   });
//   }

export default Test