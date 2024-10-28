import { useState } from "react";
import {
  Page,
  DataTable,
  Modal,
  LegacyCard,
  Button,
  InlineStack,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import ProductModal from "./app.modal";
import AddProductModal from "./app.addProduct";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export async function action({ request }) {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const _action = formData.get("_action");
  
    switch (_action) {
      case "updateProduct": {
        try {
          const productId = formData.get("productId");
          const title = formData.get("title");
          const description = formData.get("description");
          const price = formData.get("price");
          const vendor = formData.get("vendor");
          const newImages = JSON.parse(formData.get("newImages") || "[]");
          const remainingImageIds = JSON.parse(formData.get("remainingImageIds") || "[]");
  
          // Update product mutation
          const UPDATE_PRODUCT_MUTATION = `#graphql
            mutation productUpdate($input: ProductInput!) {
              productUpdate(input: $input) {
                product {
                  id
                  title
                  description
                  vendor
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
  
          const productResponse = await admin.graphql(
            UPDATE_PRODUCT_MUTATION,
            {
              variables: {
                input: {
                  id: productId,
                  title,
                  description,
                  vendor,
                  variants: [
                    {
                      price: price.toString(),
                    }
                  ]
                },
              },
            }
          );
  
          const productData = await productResponse.json();
  
          if (productData.data.productUpdate.userErrors.length > 0) {
            return json(
              {
                status: "error",
                message: productData.data.productUpdate.userErrors[0].message,
              },
              { status: 400 }
            );
          }
  
          // Delete removed images
          const DELETE_IMAGE_MUTATION = `#graphql
            mutation productImageDelete($imageId: ID!) {
              productImageDelete(id: $imageId) {
                deletedImageId
                userErrors {
                  field
                  message
                }
              }
            }
          `;
  
          const existingImages = product.node.images.edges;
          const imagesToDelete = existingImages
            .filter(img => !remainingImageIds.includes(img.node.id))
            .map(img => img.node.id);
  
          for (const imageId of imagesToDelete) {
            await admin.graphql(
              DELETE_IMAGE_MUTATION,
              {
                variables: {
                  imageId
                },
              }
            );
          }
  
          // Add new images
          if (newImages.length > 0) {
            const CREATE_IMAGE_MUTATION = `#graphql
              mutation productImageCreate($input: ProductImageInput!) {
                productImageCreate(input: $input) {
                  image {
                    id
                    url
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;
  
            for (const image of newImages) {
              await admin.graphql(
                CREATE_IMAGE_MUTATION,
                {
                  variables: {
                    input: {
                      productId,
                      image
                    },
                  },
                }
              );
            }
          }
  
          return json({ status: "success" });
        } catch (error) {
          console.error("Error updating product:", error);
          return json(
            {
              status: "error",
              message: "An error occurred while updating the product",
            },
            { status: 500 }
          );
        }
      }
  
      case "deleteProduct": {
        try {
          const productId = formData.get("productId");
  
          const DELETE_PRODUCT_MUTATION = `#graphql
            mutation productDelete($input: ProductDeleteInput!) {
              productDelete(input: $input) {
                deletedProductId
                userErrors {
                  field
                  message
                }
              }
            }
          `;
  
          const response = await admin.graphql(
            DELETE_PRODUCT_MUTATION,
            {
              variables: {
                input: {
                  id: productId,
                },
              },
            }
          );
  
          const data = await response.json();
  
          if (data.data.productDelete.userErrors.length > 0) {
            return json(
              {
                status: "error",
                message: data.data.productDelete.userErrors[0].message,
              },
              { status: 400 }
            );
          }
  
          return json({ status: "success" });
        } catch (error) {
          console.error("Error deleting product:", error);
          return json(
            {
              status: "error",
              message: "An error occurred while deleting the product",
            },
            { status: 500 }
          );
        }
      }
  
      default:
        return json({ status: "error", message: "Invalid action" }, { status: 400 });
    }
  }

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            vendor
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }
    }`
  );

  const data = await response.json();

  const {
    data: {
      products: { edges },
    },
  } = data;

  return edges;
}

export default function Table() {
  const products = useLoaderData();

  const [selectedProduct, setSelectedProduct] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleProductClick = (id) => {
    const product = products.find((p) => p.node.id === id);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const formatPrice = (price, currencyCode) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  const rows = products.map((product) => [
    <button
      key={product.node.id}
      onClick={() => handleProductClick(product.node.id)}
      style={{
        background: "none",
        border: "none",
        color: "#2c6ecb",
        cursor: "pointer",
      }}
    >
      {product.node.title}
    </button>,
    product.node.description,
    <Thumbnail
      source={product.node.images.edges[0]?.node.url || ''}
      alt={product.node.images.edges[0]?.node.altText || product.node.title}
      size="small"
    />,
    formatPrice(
      product.node.priceRangeV2.minVariantPrice.amount,
      product.node.priceRangeV2.minVariantPrice.currencyCode
    ),
    product.node.vendor,
  ]);

  return (
    <Page
      title={
        <InlineStack gap="4" align="space-between">
          <Text variant="heading2xl" as="h1">
            Products
          </Text>
          <Button primary onClick={() => setIsAddModalOpen(true)}>
            Add product
          </Button>
        </InlineStack>
      }
    >
      <LegacyCard>
        <DataTable
          columnContentTypes={["text", "text", "text", "numeric", "text"]}
          headings={[
            "Product",
            "Description",
            "Image",
            "Price",
            "Vendor",
          ]}
          rows={rows}
        />
      </LegacyCard>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct?.node?.title || ""}
      >
        <Modal.Section>
          <ProductModal product={selectedProduct} />
        </Modal.Section>
      </Modal>

      <Modal
  open={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  title="Add New Product"
>
  <Modal.Section>
    <AddProductModal onClose={() => setIsAddModalOpen(false)} />
  </Modal.Section>
</Modal>
    </Page>
  );
}

