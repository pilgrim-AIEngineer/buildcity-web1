import LoadMoreButton from "../../../components/LoadMoreButton";
import OrderCard from "./OrderCard";
import { InboxIcon, SearchIcon } from "../ui/icons";
import { PageHeader, Segmented, Chip, ChipRow, SearchField, Card, EmptyState, Button } from "../ui/primitives";

const countBy = (list, status) => list.filter((o) => (o.status || "PENDING").toUpperCase() === status).length;

export default function OrdersTab({
  districtName,
  vendorOrders,
  activeOrders,
  completedOrders,
  filteredOrders,
  completedOrdersCount,
  vendorOrdersCount,
  sectionTab,
  onSectionTabChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  highlightedOrderId,
  statusTransition,
  updatingOrderId,
  getCustomerStats,
  onStatusChange,
  pagination,
}) {
  const filters =
    sectionTab === "ACTIVE"
      ? [
          { value: "ALL", label: "All", count: activeOrders.length },
          { value: "PENDING", label: "Pending", count: countBy(activeOrders, "PENDING") },
          { value: "PROCESSING", label: "Processing", count: countBy(activeOrders, "PROCESSING") },
          { value: "OUT_FOR_DELIVERY", label: "Out for delivery", count: countBy(activeOrders, "OUT_FOR_DELIVERY") },
        ]
      : [
          { value: "ALL", label: "All", count: completedOrdersCount },
          { value: "DELIVERED", label: "Delivered", count: countBy(completedOrders, "DELIVERED") },
          { value: "CANCELLED", label: "Cancelled", count: countBy(completedOrders, "CANCELLED") },
        ];

  const isHighlighted = (ord) =>
    Boolean(
      highlightedOrderId &&
        (highlightedOrderId === ord.id ||
          (ord.orderNumber && highlightedOrderId === ord.orderNumber) ||
          (ord.id && (String(highlightedOrderId).includes(ord.id) || String(ord.id).includes(highlightedOrderId))))
    );

  return (
    <div>
      <PageHeader title="Orders" />

      <div className="space-y-3">
        <Segmented
          label="Order status"
          value={sectionTab}
          onChange={onSectionTabChange}
          options={[
            { value: "ACTIVE", label: "Active", count: activeOrders.length },
            { value: "COMPLETED", label: "Completed", count: completedOrdersCount },
          ]}
        />

        <ChipRow>
          {filters.map((f) => (
            <Chip key={f.value} active={statusFilter === f.value} count={f.count} onClick={() => onStatusFilterChange(f.value)}>
              {f.label}
            </Chip>
          ))}
          <Chip active={statusFilter === "REPEAT_BUYERS"} onClick={() => onStatusFilterChange(statusFilter === "REPEAT_BUYERS" ? "ALL" : "REPEAT_BUYERS")}>
            Repeat customers
          </Chip>
        </ChipRow>

        <SearchField value={search} onChange={onSearchChange} placeholder="Search by customer, phone or order ID" />
      </div>

      <div className="mt-4">
        {vendorOrders.length === 0 ? (
          <Card>
            <EmptyState icon={InboxIcon} title="No orders yet" description="New orders will show up here." />
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <EmptyState
              icon={SearchIcon}
              title="No matching orders"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onStatusFilterChange("ALL");
                    onSearchChange("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="vd-stagger grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {filteredOrders.map((ord, idx) => (
              <OrderCard
                key={ord.id}
                index={idx}
                order={ord}
                districtName={districtName}
                customerStats={getCustomerStats(ord)}
                isHighlighted={isHighlighted(ord)}
                transition={statusTransition}
                isUpdating={Boolean(updatingOrderId && String(updatingOrderId) === String(ord.id))}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}

        <LoadMoreButton
          hasMore={pagination.hasMore}
          loading={pagination.loading}
          onClick={pagination.onLoadMore}
          shown={vendorOrders.length}
          total={vendorOrdersCount}
        />
      </div>
    </div>
  );
}
